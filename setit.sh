#!/bin/bash

# TaskBoss-AI - All-in-One Setup Script
# This script automates the entire installation and configuration process on a fresh Ubuntu/Debian VPS.

set -e

# --- Configuration ---
APP_DIR="/var/www/taskboss-ai"
APP_USER="www-data"
NGINX_CONFIG_FILE="/etc/nginx/sites-available/taskboss-ai"
DOMAIN_NAME="" # Leave empty to use IP address
OPENAI_API_KEY="" # Leave empty to be prompted

# --- Colors for Output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# --- Helper Functions ---
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- Main Setup Logic ---

# 1. Check for Root Privileges
if [ "$EUID" -ne 0 ]; then
    print_error "This script must be run as root. Please use 'sudo ./setit.sh'"
    exit 1
fi

# 2. System Update and Dependency Installation
print_status "Updating system and installing dependencies..."
apt-get update
apt-get install -y curl wget git nginx nodejs sqlite3 build-essential python3 ufw
print_success "System dependencies installed."

# 3. Install PM2
print_status "Installing PM2 process manager globally..."
npm install -g pm2
pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
print_success "PM2 installed and configured to run on startup."

# 4. Application Directory and File Copy
print_status "Setting up application directory at $APP_DIR..."
mkdir -p $APP_DIR
rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' ./ $APP_DIR/
print_success "Application files copied to $APP_DIR."

# 5. Install Application Dependencies
print_status "Installing frontend and backend dependencies..."
cd $APP_DIR
npm install
if [ -f "server/package.json" ]; then
    (cd server && npm install)
fi
print_success "All Node.js dependencies are installed."

# 6. Build Frontend
print_status "Building the React frontend..."
npm run build
print_success "Frontend built successfully."

# 7. Environment Variable Setup
if [ -z "$OPENAI_API_KEY" ]; then
    print_warning "OpenAI API Key is required for AI features."
    read -p "Please enter your OpenAI API key: " OPENAI_API_KEY
fi

JWT_SECRET=$(openssl rand -hex 32)

cat > $APP_DIR/.env << EOF
OPENAI_API_KEY=$OPENAI_API_KEY
JWT_SECRET=$JWT_SECRET
PORT=3001
NODE_ENV=production
DB_PATH=./server/taskboss.db
EOF

cp $APP_DIR/.env $APP_DIR/server/.env
print_success "Environment files (.env) created."

# 8. Database Initialization
print_status "Initializing SQLite database..."
if [ -f "$APP_DIR/server/db.example.json" ] && [ ! -f "$APP_DIR/server/taskboss.db" ]; then
    # This assumes a migration script exists. If not, the server will create an empty DB.
    node "$APP_DIR/server/migrate-from-json.js"
    print_success "Database migrated from JSON example."
elif [ ! -f "$APP_DIR/server/taskboss.db" ]; then
    # If no migration, create empty DB
    sqlite3 $APP_DIR/server/taskboss.db "VACUUM;"
    print_success "Empty SQLite database created."
else
    print_success "Database already exists."
fi

# 9. Set Permissions
print_status "Setting file and directory permissions..."
chown -R $APP_USER:$APP_USER $APP_DIR
chmod -R 755 $APP_DIR
print_success "Permissions set correctly."

# 10. PM2 Application Setup
print_status "Configuring PM2 to run the application..."
cat > $APP_DIR/ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: 'taskboss-ai',
    script: 'server/server.js',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

cd $APP_DIR
pm2 start ecosystem.config.cjs
pm2 save
print_success "Application started with PM2."

# 11. Nginx Configuration
if [ -z "$DOMAIN_NAME" ]; then
    SERVER_NAME=$(curl -s ifconfig.me)
else
    SERVER_NAME=$DOMAIN_NAME
fi

print_status "Configuring Nginx for server name: $SERVER_NAME..."
cat > $NGINX_CONFIG_FILE << EOF
server {
    listen 80;
    server_name $SERVER_NAME;

    root $APP_DIR/dist;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf $NGINX_CONFIG_FILE /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 12. Test and Reload Nginx
print_status "Testing and reloading Nginx configuration..."
if nginx -t; then
    systemctl restart nginx
    print_success "Nginx reloaded successfully."
else
    print_error "Nginx configuration test failed. Please check the config file."
    exit 1
fi

# 13. Firewall Configuration
print_status "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow http
ufw allow https
ufw deny 3001
print_success "Firewall configured to allow web traffic."

# --- Final Output ---
echo ""
print_success "🚀 TaskBossAI setup is complete!"
echo ""
echo "You can access your application at: http://$SERVER_NAME"
echo "To monitor the application, use 'pm2 status' or 'pm2 logs taskboss-ai'."
echo ""
