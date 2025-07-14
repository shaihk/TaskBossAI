#!/bin/bash

# Task Flow AI - VPS Setup Script
# This script automates the installation process on Ubuntu/Debian VPS

set -e  # Exit on any error

echo "========================================="
echo "    Task Flow AI - VPS Setup Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

print_status "Starting VPS setup for Task Flow AI..."

# Step 1: Update system
print_status "Updating system packages..."
apt update && apt upgrade -y
print_success "System updated successfully"

# Step 2: Install essential system dependencies
print_status "Installing essential system dependencies..."
apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release build-essential python3 python3-pip unzip
print_success "Essential dependencies installed successfully"

# Step 3: Install Node.js (Latest LTS)
print_status "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
    apt install -y nodejs
    print_success "Node.js installed successfully"
else
    print_success "Node.js is already installed"
fi

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_success "Node.js version: $NODE_VERSION"
print_success "NPM version: $NPM_VERSION"

# Step 4: Install Git
print_status "Installing Git..."
if ! command -v git &> /dev/null; then
    apt install -y git
    print_success "Git installed successfully"
else
    print_success "Git is already installed"
fi

# Step 5: Install PM2
print_status "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    print_success "PM2 installed successfully"
else
    print_success "PM2 is already installed"
fi

# Step 6: Install Nginx
print_status "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    print_success "Nginx installed and started successfully"
else
    print_success "Nginx is already installed"
fi

# Step 7: Install additional tools
print_status "Installing additional development tools..."
apt install -y htop nano vim ufw fail2ban certbot python3-certbot-nginx
print_success "Additional tools installed successfully"

# Step 8: Setup application directory
CURRENT_DIR=$(pwd)
APP_DIR="/var/www/task-flow-ai"

# Check if we're running from the application directory
if [ -f "$CURRENT_DIR/package.json" ] && [ -f "$CURRENT_DIR/server/package.json" ]; then
    print_status "Detected application files in current directory: $CURRENT_DIR"
    read -p "Deploy from current directory? (y/n): " USE_CURRENT
    
    if [[ $USE_CURRENT =~ ^[Yy]$ ]]; then
        print_status "Copying application files to $APP_DIR..."
        mkdir -p $APP_DIR
        
        # Copy all files except node_modules, .git, and build directories
        rsync -av --exclude=node_modules --exclude=.git --exclude=dist --exclude=build --exclude=.env --exclude=server/.env "$CURRENT_DIR/" "$APP_DIR/"
        
        # Copy .env files if they exist
        if [ -f "$CURRENT_DIR/.env" ]; then
            cp "$CURRENT_DIR/.env" "$APP_DIR/.env"
            print_success "Existing .env file copied"
        fi
        if [ -f "$CURRENT_DIR/server/.env" ]; then
            cp "$CURRENT_DIR/server/.env" "$APP_DIR/server/.env"
            print_success "Existing server/.env file copied"
        fi
        
        cd $APP_DIR
        print_success "Application files copied successfully"
    else
        print_status "Creating application directory at $APP_DIR..."
        mkdir -p $APP_DIR
        cd $APP_DIR
        
        # Clone repository
        print_status "Please enter your GitHub repository URL:"
        read -p "Repository URL: " REPO_URL
        
        if [ -n "$REPO_URL" ]; then
            print_status "Cloning repository..."
            git clone $REPO_URL .
            print_success "Repository cloned successfully"
        else
            print_warning "No repository URL provided. Please clone manually later."
        fi
    fi
else
    print_status "Creating application directory at $APP_DIR..."
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    # Clone repository (if not already present)
    if [ ! -d ".git" ]; then
        print_status "Please enter your GitHub repository URL:"
        read -p "Repository URL: " REPO_URL
        
        if [ -n "$REPO_URL" ]; then
            print_status "Cloning repository..."
            git clone $REPO_URL .
            print_success "Repository cloned successfully"
        else
            print_warning "No repository URL provided. Please clone manually later."
        fi
    else
        print_success "Git repository already exists"
    fi
fi

# Step 9: Install dependencies
if [ -f "package.json" ]; then
    print_status "Installing Node.js dependencies..."
    npm install
    print_success "Dependencies installed successfully"
    
    # Install server dependencies
    if [ -d "server" ] && [ -f "server/package.json" ]; then
        print_status "Installing server dependencies..."
        cd server
        npm install
        cd ..
        print_success "Server dependencies installed successfully"
    fi
    
    # Build the React frontend
    print_status "Building React frontend..."
    npm run build
    print_success "Frontend built successfully"
else
    print_warning "package.json not found. Please install dependencies manually."
fi

# Step 10: Setup environment variables
print_status "Setting up environment variables..."

# Function to generate secure JWT secret
generate_jwt_secret() {
    echo "TaskFlowAI_$(date +%s)$(shuf -i 100000-999999 -n 1)_$(openssl rand -hex 16)" 2>/dev/null || echo "TaskFlowAI_$(date +%s)$(shuf -i 100000-999999 -n 1)_$(head -c 32 /dev/urandom | base64 | tr -d '=+/' | cut -c1-32)"
}

# Check if .env files exist
if [ -f ".env" ] && [ -f "server/.env" ]; then
    print_success "Configuration files already exist"
    print_success "Using existing environment configuration"
else
    print_status "Setting up environment configuration for first time..."
    
    echo ""
    echo "========================================="
    echo "    OpenAI API Key Configuration"
    echo "========================================="
    echo ""
    echo "To use the AI features (chat, task suggestions, consultation),"
    echo "you need an OpenAI API key."
    echo ""
    echo "How to get your OpenAI API key:"
    echo "1. Go to: https://platform.openai.com/account/api-keys"
    echo "2. Sign in to your OpenAI account (or create one)"
    echo "3. Click 'Create new secret key'"
    echo "4. Copy the key (it starts with sk-...)"
    echo ""
    echo "IMPORTANT: Keep this key secure and never share it publicly!"
    echo ""
    
    while true; do
        read -s -p "Please enter your OpenAI API key: " OPENAI_KEY
        echo ""
        
        if [ -z "$OPENAI_KEY" ]; then
            print_error "API key cannot be empty!"
            continue
        fi
        
        # Basic validation - check if key starts with sk-
        if [[ $OPENAI_KEY =~ ^sk-[a-zA-Z0-9_-]+$ ]]; then
            print_success "API key format looks correct"
            
            # Test the API key
            print_status "Testing OpenAI API key..."
            
            # Create a simple test request
            TEST_RESPONSE=$(curl -s -X POST "https://api.openai.com/v1/models" \
                -H "Authorization: Bearer $OPENAI_KEY" \
                -H "Content-Type: application/json" \
                --connect-timeout 10 \
                --max-time 30 || echo "curl_failed")
            
            if [ "$TEST_RESPONSE" = "curl_failed" ]; then
                print_warning "Could not connect to OpenAI API (network issue)"
                read -p "Continue anyway? (y/n): " confirm
                if [[ $confirm =~ ^[Yy]$ ]]; then
                    break
                fi
            elif echo "$TEST_RESPONSE" | grep -q '"object": "list"' && echo "$TEST_RESPONSE" | grep -q '"data"'; then
                print_success "✓ API key validated successfully!"
                break
            elif echo "$TEST_RESPONSE" | grep -q '"error"'; then
                ERROR_MSG=$(echo "$TEST_RESPONSE" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data.get('error', {}).get('message', 'Unknown error'))" 2>/dev/null || echo "Invalid API key")
                print_error "API key validation failed: $ERROR_MSG"
                print_error "Please check your OpenAI API key and try again"
                continue
            else
                print_warning "Could not validate API key (unexpected response)"
                read -p "Continue anyway? (y/n): " confirm
                if [[ $confirm =~ ^[Yy]$ ]]; then
                    break
                fi
            fi
        else
            print_warning "API key should start with 'sk-' and contain only letters, numbers, hyphens, and underscores"
            read -p "Continue anyway? (y/n): " confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                break
            fi
        fi
    done
    
    JWT_SECRET=$(generate_jwt_secret)
    
    print_status "Creating main .env file..."
    cat > .env << EOF
# OpenAI API Configuration
OPENAI_API_KEY=$OPENAI_KEY

# JWT Secret (auto-generated)
JWT_SECRET=$JWT_SECRET

# Server Configuration
PORT=3001
NODE_ENV=production
EOF
    print_success "Main .env file created successfully"
    
    print_status "Creating server .env file..."
    cat > server/.env << EOF
# OpenAI API Configuration
OPENAI_API_KEY=$OPENAI_KEY

# JWT Secret (auto-generated)
JWT_SECRET=$JWT_SECRET

# Server Configuration
PORT=3001
NODE_ENV=production
EOF
    print_success "Server .env file created successfully"
fi

# Step 11: Handle database initialization
echo ""
echo "========================================="
echo "    Database Setup"
echo "========================================="
echo ""

print_status "Checking database setup..."
if [ -d "server" ]; then
    if [ -f "server/db.json" ]; then
        print_success "Database file found - using existing data"
        print_success "Your tasks, goals, and user data will be preserved"
        # Backup existing database
        cp server/db.json server/db.backup.$(date +%Y%m%d_%H%M%S).json
        print_success "Database backed up successfully"
    elif [ -f "server/db.example.json" ]; then
        print_status "No database found, creating from example..."
        cp server/db.example.json server/db.json
        print_success "Database initialized with example data"
    else
        print_warning "No database file found!"
        print_warning "Please ensure db.json exists in server directory"
        print_warning "You may need to manually upload your db.json file to the server/ directory"
    fi
else
    print_warning "Server directory not found. Database setup skipped."
fi

# Step 12: Set proper permissions
print_status "Setting proper file permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR
chmod 600 .env 2>/dev/null || true
chmod 600 server/.env 2>/dev/null || true

# Make scripts executable
chmod +x start-server.sh 2>/dev/null || true
chmod +x setup.sh 2>/dev/null || true
chmod +x stop.sh 2>/dev/null || true
chmod +x status.sh 2>/dev/null || true
chmod +x pre-check.sh 2>/dev/null || true
chmod +x vps-setup.sh 2>/dev/null || true
chmod +x vps-update.sh 2>/dev/null || true

print_success "File permissions set successfully"

# Step 13: Test the application
print_status "Testing the application..."
if [ -f "server/server.js" ]; then
    cd server
    timeout 10s node server.js &
    SERVER_PID=$!
    sleep 5
    
    if kill -0 $SERVER_PID 2>/dev/null; then
        kill $SERVER_PID
        print_success "Application test passed"
        cd ..
    else
        print_warning "Application test failed. Please check configuration."
        cd ..
    fi
elif [ -f "server.js" ]; then
    timeout 10s node server.js &
    SERVER_PID=$!
    sleep 5
    
    if kill -0 $SERVER_PID 2>/dev/null; then
        kill $SERVER_PID
        print_success "Application test passed"
    else
        print_warning "Application test failed. Please check configuration."
    fi
else
    print_warning "Server file not found. Please check your application structure."
fi

# Step 14: Setup PM2
print_status "Setting up PM2 process manager..."

# Determine the correct server file path
if [ -f "server/server.js" ]; then
    SERVER_FILE="server/server.js"
    WORK_DIR="$APP_DIR"
elif [ -f "server.js" ]; then
    SERVER_FILE="server.js"
    WORK_DIR="$APP_DIR"
else
    print_error "Server file not found!"
    exit 1
fi

# Create PM2 ecosystem file (use .cjs extension for CommonJS)
cat > ecosystem.config.cjs << EOF
module.exports = {
  apps: [{
    name: 'task-flow-ai',
    script: '$SERVER_FILE',
    cwd: '$WORK_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOF

# Start the application with PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

print_success "PM2 configured and application started"

# Step 15: Setup Nginx configuration
print_status "Configuring Nginx..."

# Get domain name or use IP
echo ""
print_status "Please enter your domain name (or press Enter to use IP address):"
read -p "Domain name (optional): " DOMAIN_NAME

if [ -z "$DOMAIN_NAME" ]; then
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
    SERVER_NAME=$SERVER_IP
    print_status "Using IP address: $SERVER_IP"
else
    SERVER_NAME=$DOMAIN_NAME
    print_status "Using domain: $DOMAIN_NAME"
fi

# Create Nginx configuration
cat > /etc/nginx/sites-available/task-flow-ai << EOF
server {
    listen 80;
    server_name $SERVER_NAME;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

    # Main application
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Login endpoint with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Block access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ \.(env|log|config)$ {
        deny all;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/task-flow-ai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if nginx -t; then
    systemctl reload nginx
    print_success "Nginx configured and reloaded successfully"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Step 16: Setup firewall
print_status "Setting up firewall..."
if command -v ufw &> /dev/null; then
    ufw --force enable
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP (Nginx)
    ufw allow 443/tcp   # HTTPS (for future SSL)
    ufw deny 3001/tcp   # Block direct access to Node.js
    print_success "Firewall configured - Node.js port blocked, only Nginx access allowed"
else
    print_warning "UFW not available. Please configure firewall manually."
fi

# Step 17: Setup SSL (optional)
print_status "Would you like to setup SSL certificate with Let's Encrypt? (y/n)"
read -p "Setup SSL: " SETUP_SSL

if [[ $SETUP_SSL =~ ^[Yy]$ ]] && [ -n "$DOMAIN_NAME" ]; then
    print_status "Installing Certbot..."
    apt install -y certbot python3-certbot-nginx
    
    print_status "Obtaining SSL certificate..."
    certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME
    
    if [ $? -eq 0 ]; then
        print_success "SSL certificate installed successfully"
        
        # Setup auto-renewal
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        print_success "SSL auto-renewal configured"
    else
        print_warning "SSL certificate installation failed"
    fi
elif [[ $SETUP_SSL =~ ^[Yy]$ ]] && [ -z "$DOMAIN_NAME" ]; then
    print_warning "SSL requires a domain name. Skipping SSL setup."
fi

# Step 18: Final status check
print_status "Checking final status..."
sleep 3

# Check PM2 status
PM2_STATUS=$(pm2 list | grep task-flow-ai | grep online || echo "")
if [ -n "$PM2_STATUS" ]; then
    print_success "Application is running successfully!"
else
    print_warning "Application may not be running. Check PM2 status."
fi

# Check Nginx status
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running successfully!"
else
    print_warning "Nginx may not be running properly."
fi

# Get final URL
if [ -n "$DOMAIN_NAME" ] && [[ $SETUP_SSL =~ ^[Yy]$ ]]; then
    FINAL_URL="https://$DOMAIN_NAME"
elif [ -n "$DOMAIN_NAME" ]; then
    FINAL_URL="http://$DOMAIN_NAME"
else
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
    FINAL_URL="http://$SERVER_IP"
fi

echo ""
echo "========================================="
echo "           SETUP COMPLETE!"
echo "========================================="
echo ""
print_success "Task Flow AI has been installed successfully!"
echo ""
echo "🌐 Application URL: $FINAL_URL"
echo "🔒 Direct Node.js access blocked for security"
echo ""
echo "🔧 Useful commands:"
echo "   pm2 status                 - Check application status"
echo "   pm2 logs task-flow-ai      - View application logs"
echo "   pm2 restart task-flow-ai   - Restart application"
echo "   pm2 stop task-flow-ai      - Stop application"
echo "   nginx -t                   - Test Nginx configuration"
echo "   systemctl reload nginx     - Reload Nginx"
echo ""
echo "📁 Application directory: $APP_DIR"
echo "📁 Nginx config: /etc/nginx/sites-available/task-flow-ai"
echo ""
echo "🔄 To update the application:"
echo "   cd $APP_DIR"
echo "   git pull origin main"
echo "   npm install"
echo "   pm2 restart task-flow-ai"
echo ""
echo "🔐 Security features enabled:"
echo "   ✅ Rate limiting on API endpoints"
echo "   ✅ Security headers"
echo "   ✅ Direct Node.js access blocked"
echo "   ✅ Sensitive files blocked"
echo "   ✅ Gzip compression enabled"
if [[ $SETUP_SSL =~ ^[Yy]$ ]] && [ -n "$DOMAIN_NAME" ]; then
    echo "   ✅ SSL certificate installed"
fi
echo ""
print_success "Setup completed successfully! 🚀"