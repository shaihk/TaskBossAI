#!/bin/bash

# TaskBoss-AI - Complete VPS Setup Script
# This script sets up the TaskBoss-AI application on a VPS server with nginx and pm2

set -e  # Exit on any error

echo "========================================"
echo "    TaskBoss-AI - Complete VPS Setup"
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
DOMAIN="your-domain.com"  # Will be asked from user
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

# Stop all running processes
stop_existing_processes() {
    print_info "Stopping existing processes..."
    
    # Stop PM2 processes
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Kill any remaining node processes
    sudo pkill -f "node" 2>/dev/null || true
    sudo pkill -f "npm" 2>/dev/null || true
    
    print_status "All existing processes stopped"
}

# Clean previous installation
clean_previous_installation() {
    print_info "Cleaning previous installation..."
    
    # Remove application directory if exists
    if [[ -d "$APP_DIR" ]]; then
        print_warning "Removing existing application directory..."
        sudo rm -rf "$APP_DIR"
    fi
    
    # Remove nginx configuration if exists
    if [[ -f "$NGINX_CONF" ]]; then
        sudo rm -f "$NGINX_CONF"
        sudo rm -f "$NGINX_ENABLED"
    fi
    
    print_status "Previous installation cleaned"
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
    
    # Remove old Node.js if exists
    sudo apt remove -y nodejs npm 2>/dev/null || true
    
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
    
    # Remove old PM2 if exists
    sudo npm uninstall -g pm2 2>/dev/null || true
    
    # Install PM2
    sudo npm install -g pm2
    
    # Setup PM2 to start on boot
    sudo pm2 startup
    
    print_status "PM2 installed and configured for startup"
}

# Install and configure nginx
install_nginx() {
    print_info "Installing and configuring nginx..."
    
    # Remove old nginx configuration
    sudo apt remove -y nginx nginx-common 2>/dev/null || true
    sudo apt autoremove -y
    
    # Install nginx
    sudo apt install -y nginx
    
    # Start and enable nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    print_status "Nginx installed and started"
}

# Install other dependencies
install_dependencies() {
    print_info "Installing additional dependencies..."
    sudo apt install -y git curl wget unzip build-essential python3-dev
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

# Get domain name from user
get_domain() {
    echo
    echo "========================================"
    echo "    Domain Configuration"
    echo "========================================"
    echo
    
    while true; do
        read -p "Enter your domain name (e.g., example.com): " DOMAIN
        if [[ -z "$DOMAIN" ]]; then
            print_warning "Domain cannot be empty!"
            continue
        fi
        break
    done
    
    print_status "Domain configured: $DOMAIN"
}

# Get API keys from user
get_api_keys() {
    echo
    echo "========================================"
    echo "    AI API Keys Configuration"
    echo "========================================"
    echo
    echo "TaskBoss-AI supports both OpenAI and Google Gemini for AI features"
    echo "(chat, task suggestions, consultation, quote generation)."
    echo
    echo "You can configure one or both API keys:"
    echo "- OpenAI: More advanced features, requires paid API"
    echo "- Gemini: Free tier available, good performance"
    echo
    
    # Get OpenAI API key
    echo "========================================"
    echo "    OpenAI API Key (Optional)"
    echo "========================================"
    echo
    echo "How to get your OpenAI API key:"
    echo "1. Go to: https://platform.openai.com/account/api-keys"
    echo "2. Sign in to your OpenAI account (or create one)"
    echo "3. Click 'Create new secret key'"
    echo "4. Copy the key (it starts with sk-...)"
    echo
    echo "IMPORTANT: Keep this key secure and never share it publicly!"
    echo
    
    read -p "Enter your OpenAI API key (or press Enter to skip): " OPENAI_KEY
    
    if [[ -n "$OPENAI_KEY" ]]; then
        # Basic validation - check if key starts with sk-
        if [[ ! "$OPENAI_KEY" =~ ^sk- ]]; then
            print_warning "API key should start with 'sk-'"
            read -p "Continue anyway? (y/n): " confirm
            if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
                OPENAI_KEY=""
            fi
        fi
    fi
    
    if [[ -n "$OPENAI_KEY" ]]; then
        print_status "OpenAI API key configured"
    else
        print_warning "OpenAI API key skipped"
    fi
    
    # Get Gemini API key
    echo
    echo "========================================"
    echo "    Google Gemini API Key (Optional)"
    echo "========================================"
    echo
    echo "How to get your Gemini API key:"
    echo "1. Go to: https://aistudio.google.com/app/apikey"
    echo "2. Sign in to your Google account"
    echo "3. Click 'Create API key'"
    echo "4. Copy the key (it starts with AIza...)"
    echo
    echo "IMPORTANT: Keep this key secure and never share it publicly!"
    echo
    
    read -p "Enter your Gemini API key (or press Enter to skip): " GEMINI_KEY
    
    if [[ -n "$GEMINI_KEY" ]]; then
        # Basic validation - check if key starts with AIza
        if [[ ! "$GEMINI_KEY" =~ ^AIza ]]; then
            print_warning "Gemini API key should start with 'AIza'"
            read -p "Continue anyway? (y/n): " confirm
            if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
                GEMINI_KEY=""
            fi
        fi
    fi
    
    if [[ -n "$GEMINI_KEY" ]]; then
        print_status "Gemini API key configured"
    else
        print_warning "Gemini API key skipped"
    fi
    
    # Validate at least one key is provided
    if [[ -z "$OPENAI_KEY" && -z "$GEMINI_KEY" ]]; then
        print_error "At least one API key (OpenAI or Gemini) is required!"
        echo "Please run the setup again with at least one API key."
        exit 1
    fi
}

# Create environment files
create_env_files() {
    print_info "Creating environment configuration files..."
    
    # Generate JWT secret
    JWT_SECRET="TaskBossAI_$(openssl rand -hex 32)_$(date +%s)"
    
    # Create main .env file
    cat > $APP_DIR/.env << EOF
# TaskBoss-AI Configuration
# Generated on $(date)

# AI API Keys Configuration
OPENAI_API_KEY=$OPENAI_KEY
GEMINI_API_KEY=$GEMINI_KEY

# JWT Secret (auto-generated)
JWT_SECRET=$JWT_SECRET

# Server Configuration
PORT=$PORT
NODE_ENV=production

# Database Configuration
DB_PATH=./server/taskboss.db
EOF

    # Create server .env file
    mkdir -p $APP_DIR/server
    cat > $APP_DIR/server/.env << EOF
# TaskBoss-AI Server Configuration
# Generated on $(date)

# AI API Keys Configuration
OPENAI_API_KEY=$OPENAI_KEY
GEMINI_API_KEY=$GEMINI_KEY

# JWT Secret (auto-generated)
JWT_SECRET=$JWT_SECRET

# Server Configuration
PORT=$PORT
NODE_ENV=production

# Database Configuration
DB_PATH=./taskboss.db
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
    print_info "Setting up SQLite database..."
    
    cd $APP_DIR/server
    
    # Check if SQLite database already exists
    if [[ -f "taskboss.db" ]]; then
        print_status "Using existing SQLite database"
    elif [[ -f "db.json" ]]; then
        print_info "JSON database found, migrating to SQLite..."
        
        # Run migration script
        node migrate-from-json.js
        
        print_status "Data migrated from JSON to SQLite successfully"
    else
        print_info "No existing database found, creating new SQLite database..."
        
        # Create new SQLite database
        node create-new-db.js
        
        print_status "New SQLite database initialized"
    fi
    
    cd $APP_DIR
    
    # Set proper permissions
    chmod 644 $APP_DIR/server/taskboss.db 2>/dev/null || true
}

# Install application dependencies
install_app_dependencies() {
    print_info "Installing application dependencies..."
    
    cd $APP_DIR
    
    # Clean any existing node_modules
    rm -rf node_modules package-lock.json
    rm -rf server/node_modules server/package-lock.json
    
    # Install frontend dependencies
    print_info "Installing frontend dependencies..."
    npm install
    
    # Install server dependencies
    print_info "Installing server dependencies..."
    cd server
    npm install
    
    # Install SQLite3
    print_info "Installing SQLite3..."
    npm install sqlite3@^5.1.6
    
    cd $APP_DIR
    
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
    echo "  run.sh      - Start servers (after setup)"
    echo "  stop.sh     - Stop all servers"
    echo "  status.sh   - Check server status"
    echo "  pm2 logs $APP_NAME - View application logs"
    echo "  pm2 restart $APP_NAME - Restart application"
    echo "  sudo systemctl reload nginx - Reload nginx"
    echo
    echo "Configuration files:"
    echo "  Application: $APP_DIR"
    echo "  Nginx config: $NGINX_CONF"
    echo "  Environment: $APP_DIR/.env"
    echo "  Database: $APP_DIR/server/taskboss.db"
    echo
}

# Main execution
main() {
    print_info "Starting TaskBoss-AI VPS complete setup..."
    
    check_root
    get_domain
    get_api_keys
    stop_existing_processes
    clean_previous_installation
    update_system
    install_dependencies
    install_nodejs
    install_pm2
    install_nginx
    setup_app_directory
    create_env_files
    copy_app_files
    install_app_dependencies
    setup_database
    build_frontend
    configure_nginx
    setup_pm2
    setup_firewall
    setup_ssl
    final_status
    
    print_status "TaskBoss-AI has been successfully deployed on VPS!"
}

# Run main function
main "$@"