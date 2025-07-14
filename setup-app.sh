#!/bin/bash

# TaskBoss-AI - VPS Setup Script
# This script sets up the TaskBoss-AI application on a VPS server with nginx and pm2

set -e  # Exit on any error

echo "========================================"
echo "    TaskBoss-AI - VPS Setup Script"
echo "========================================"
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
APP_NAME="taskboss-ai"
APP_DIR="/var/www/$APP_NAME"
NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"
NGINX_ENABLED="/etc/nginx/sites-enabled/$APP_NAME"
DOMAIN="your-domain.com"  # Change this to your actual domain
PORT=3001
FRONTEND_PORT=80

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root for security reasons."
        print_info "Please run as a regular user with sudo privileges."
        exit 1
    fi
}

# Update system packages
update_system() {
    print_info "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    print_status "System packages updated"
}

# Install Node.js and npm
install_nodejs() {
    print_info "Installing Node.js and npm..."
    
    # Install Node.js 18.x (LTS)
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    print_status "Node.js $node_version installed"
    print_status "npm $npm_version installed"
}

# Install PM2 globally
install_pm2() {
    print_info "Installing PM2 process manager..."
    sudo npm install -g pm2
    
    # Setup PM2 to start on boot
    sudo pm2 startup
    
    print_status "PM2 installed and configured for startup"
}

# Install and configure nginx
install_nginx() {
    print_info "Installing and configuring nginx..."
    sudo apt install -y nginx
    
    # Start and enable nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    print_status "Nginx installed and started"
}

# Install other dependencies
install_dependencies() {
    print_info "Installing additional dependencies..."
    sudo apt install -y git curl wget unzip build-essential
    print_status "Additional dependencies installed"
}

# Create application directory and set permissions
setup_app_directory() {
    print_info "Setting up application directory..."
    
    # Create app directory
    sudo mkdir -p $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR
    
    print_status "Application directory created at $APP_DIR"
}

# Get OpenAI API key from user
get_openai_key() {
    echo
    echo "========================================"
    echo "    OpenAI API Key Configuration"
    echo "========================================"
    echo
    echo "To use the AI features (chat, task suggestions, consultation),"
    echo "you need an OpenAI API key."
    echo
    echo "How to get your OpenAI API key:"
    echo "1. Go to: https://platform.openai.com/account/api-keys"
    echo "2. Sign in to your OpenAI account (or create one)"
    echo "3. Click 'Create new secret key'"
    echo "4. Copy the key (it starts with sk-...)"
    echo
    echo "IMPORTANT: Keep this key secure and never share it publicly!"
    echo
    
    while true; do
        read -p "Please enter your OpenAI API key: " OPENAI_KEY
        
        if [[ -z "$OPENAI_KEY" ]]; then
            print_error "API key cannot be empty!"
            continue
        fi
        
        # Basic validation - check if key starts with sk-
        if [[ ! "$OPENAI_KEY" =~ ^sk- ]]; then
            print_warning "API key should start with 'sk-'"
            read -p "Continue anyway? (y/n): " confirm
            if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
                continue
            fi
        fi
        
        break
    done
    
    print_status "OpenAI API key configured"
}

# Create environment files
create_env_files() {
    print_info "Creating environment configuration files..."
    
    # Generate JWT secret
    JWT_SECRET="TaskBossAI_$(openssl rand -hex 32)_$(date +%s)"
    
    # Create main .env file
    cat > $APP_DIR/.env << EOF
# OpenAI API Configuration
OPENAI_API_KEY=$OPENAI_KEY

# JWT Secret (auto-generated)
JWT_SECRET=$JWT_SECRET

# Server Configuration
PORT=$PORT
NODE_ENV=production

# Database Configuration
DB_PATH=./server/db.json
EOF

    # Create server .env file
    mkdir -p $APP_DIR/server
    cat > $APP_DIR/server/.env << EOF
# OpenAI API Configuration
OPENAI_API_KEY=$OPENAI_KEY

# JWT Secret (auto-generated)
JWT_SECRET=$JWT_SECRET

# Server Configuration
PORT=$PORT
NODE_ENV=production

# Database Configuration
DB_PATH=./db.json
EOF

    print_status "Environment files created"
}

# Copy application files (assuming they're in current directory)
copy_app_files() {
    print_info "Copying application files..."
    
    # Copy all files except node_modules and .git
    rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' ./ $APP_DIR/
    
    # Ensure proper ownership
    sudo chown -R $USER:$USER $APP_DIR
    
    print_status "Application files copied"
}

# Setup database
setup_database() {
    print_info "Setting up database..."
    
    # Copy database file if it exists, otherwise use example
    if [[ -f "$APP_DIR/server/db.json" ]]; then
        print_status "Using existing database file"
    elif [[ -f "$APP_DIR/server/db.example.json" ]]; then
        cp "$APP_DIR/server/db.example.json" "$APP_DIR/server/db.json"
        print_status "Database initialized from example"
    else
        # Create minimal database structure
        cat > $APP_DIR/server/db.json << 'EOF'
{
  "tasks": [],
  "goals": [],
  "users": [],
  "user_stats": []
}
EOF
        print_status "Empty database created"
    fi
    
    # Set proper permissions
    chmod 644 $APP_DIR/server/db.json
}

# Install application dependencies
install_app_dependencies() {
    print_info "Installing application dependencies..."
    
    cd $APP_DIR
    
    # Install frontend dependencies
    print_info "Installing frontend dependencies..."
    npm install
    
    # Install server dependencies
    print_info "Installing server dependencies..."
    cd server
    npm install
    cd ..
    
    print_status "Application dependencies installed"
}

# Build frontend application
build_frontend() {
    print_info "Building frontend application..."
    
    cd $APP_DIR
    npm run build
    
    print_status "Frontend application built"
}

# Configure nginx
configure_nginx() {
    print_info "Configuring nginx..."
    
    # Create nginx configuration
    sudo tee $NGINX_CONF > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Serve static files from React build
    location / {
        root $APP_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeout for AI requests
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
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
}
EOF

    # Enable the site
    sudo ln -sf $NGINX_CONF $NGINX_ENABLED
    
    # Remove default nginx site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    sudo nginx -t
    
    # Reload nginx
    sudo systemctl reload nginx
    
    print_status "Nginx configured and reloaded"
}

# Setup PM2 configuration
setup_pm2() {
    print_info "Setting up PM2 configuration..."
    
    cd $APP_DIR
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: './server/server.js',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

    # Create logs directory
    mkdir -p logs
    
    # Start the application with PM2
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    print_status "PM2 configured and application started"
}

# Setup firewall
setup_firewall() {
    print_info "Configuring firewall..."
    
    # Enable UFW if not already enabled
    sudo ufw --force enable
    
    # Allow SSH (important!)
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80
    sudo ufw allow 443
    
    # Show firewall status
    sudo ufw status
    
    print_status "Firewall configured"
}

# Setup SSL with Let's Encrypt (optional)
setup_ssl() {
    read -p "Do you want to setup SSL with Let's Encrypt? (y/n): " setup_ssl_choice
    
    if [[ "$setup_ssl_choice" =~ ^[Yy]$ ]]; then
        print_info "Setting up SSL with Let's Encrypt..."
        
        # Install certbot
        sudo apt install -y certbot python3-certbot-nginx
        
        # Get SSL certificate
        sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN
        
        print_status "SSL certificate installed"
    else
        print_warning "SSL setup skipped. You can run 'sudo certbot --nginx -d $DOMAIN' later to enable SSL."
    fi
}

# Final status check
final_status() {
    echo
    echo "========================================"
    echo "    Setup Complete!"
    echo "========================================"
    echo
    
    # Check if services are running
    if systemctl is-active --quiet nginx; then
        print_status "Nginx is running"
    else
        print_error "Nginx is not running"
    fi
    
    if pm2 list | grep -q "$APP_NAME"; then
        print_status "TaskBoss-AI application is running"
    else
        print_error "TaskBoss-AI application is not running"
    fi
    
    echo
    echo "Application URLs:"
    echo "  Frontend: http://$DOMAIN"
    echo "  Backend API: http://$DOMAIN/api"
    echo
    echo "Useful commands:"
    echo "  View application logs: pm2 logs $APP_NAME"
    echo "  Restart application: pm2 restart $APP_NAME"
    echo "  Stop application: pm2 stop $APP_NAME"
    echo "  Reload nginx: sudo systemctl reload nginx"
    echo "  Check nginx status: sudo systemctl status nginx"
    echo
    echo "Configuration files:"
    echo "  Application: $APP_DIR"
    echo "  Nginx config: $NGINX_CONF"
    echo "  Environment: $APP_DIR/.env"
    echo "  Database: $APP_DIR/server/db.json"
    echo
}

# Main execution
main() {
    print_info "Starting TaskBoss-AI VPS setup..."
    
    # Get domain name
    read -p "Enter your domain name (e.g., example.com): " DOMAIN
    if [[ -z "$DOMAIN" ]]; then
        DOMAIN="localhost"
        print_warning "Using localhost as domain"
    fi
    
    check_root
    update_system
    install_dependencies
    install_nodejs
    install_pm2
    install_nginx
    setup_app_directory
    get_openai_key
    create_env_files
    copy_app_files
    setup_database
    install_app_dependencies
    build_frontend
    configure_nginx
    setup_pm2
    setup_firewall
    setup_ssl
    final_status
    
    print_status "TaskBoss-AI has been successfully deployed!"
}

# Run main function
main "$@"