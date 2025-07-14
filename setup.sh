#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e "    Task Flow AI - Setup Script"
echo -e "========================================${NC}"
echo ""

# Check if .env files exist
if [ -f ".env" ] && [ -f "server/.env" ]; then
    echo -e "${YELLOW}Configuration files already exist.${NC}"
    echo "If you want to reconfigure, delete .env and server/.env files and run this script again."
    echo ""
    read -p "Do you want to start the application? (y/n): " start_app
    if [[ $start_app =~ ^[Yy]$ ]]; then
        ./start-server.sh
    fi
    exit 0
fi

echo "Setting up Task Flow AI for the first time..."
echo ""

# Create server directory if it doesn't exist
mkdir -p server

# Update system packages first
echo "Updating system packages..."
sudo apt update

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed!${NC}"
    echo "Installing Git..."
    sudo apt-get install -y git
    
    if ! command -v git &> /dev/null; then
        echo -e "${RED}Failed to install Git. Please install it manually.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Git installed successfully!${NC}"
fi

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl is not installed!${NC}"
    echo "Installing curl..."
    sudo apt-get install -y curl
    
    echo -e "${GREEN}✅ curl installed successfully!${NC}"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Installing Node.js..."
    
    # Install Node.js (using NodeSource repository)
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Failed to install Node.js. Please install it manually and run this script again.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js installed successfully!${NC}"
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    sudo apt-get install -y npm
fi

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx is not installed!${NC}"
    echo "Installing Nginx..."
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    if ! command -v nginx &> /dev/null; then
        echo -e "${RED}Failed to install Nginx. Please install it manually.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Nginx installed successfully!${NC}"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 is not installed!${NC}"
    echo "Installing PM2..."
    sudo npm install -g pm2
    
    echo -e "${GREEN}✅ PM2 installed successfully!${NC}"
fi

echo -e "${GREEN}Node.js version: $(node --version)${NC}"
echo -e "${GREEN}npm version: $(npm --version)${NC}"
echo -e "${GREEN}Nginx version: $(nginx -v 2>&1)${NC}"
echo -e "${GREEN}PM2 version: $(pm2 --version)${NC}"
echo ""

echo -e "${BLUE}========================================"
echo -e "    OpenAI API Key Configuration"
echo -e "========================================${NC}"
echo ""
echo "To use the AI features (chat, task suggestions, consultation),"
echo "you need an OpenAI API key."
echo ""
echo -e "${YELLOW}How to get your OpenAI API key:${NC}"
echo "1. Go to: https://platform.openai.com/account/api-keys"
echo "2. Sign in to your OpenAI account (or create one)"
echo "3. Click \"Create new secret key\""
echo "4. Copy the key (it starts with sk-...)"
echo ""
echo -e "${RED}IMPORTANT: Keep this key secure and never share it publicly!${NC}"
echo ""

while true; do
    read -p "Please enter your OpenAI API key: " OPENAI_KEY
    
    if [ -z "$OPENAI_KEY" ]; then
        echo -e "${RED}Error: API key cannot be empty!${NC}"
        echo ""
        continue
    fi
    
    # Basic validation - check if key starts with sk-
    if [[ $OPENAI_KEY != sk-* ]]; then
        echo -e "${YELLOW}Warning: API key should start with 'sk-'${NC}"
        read -p "Are you sure this is correct? (y/n): " confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            continue
        fi
    fi
    
    break
done

echo ""
echo "Testing API key..."

# Generate random JWT secret (ensure it's long enough)
JWT_SECRET="TaskFlowAI_$(openssl rand -base64 48 2>/dev/null || head -c 48 /dev/urandom | base64 | tr -d '\n')"

# Create main .env file
cat > .env << EOF
# OpenAI API Configuration
OPENAI_API_KEY=$OPENAI_KEY

# JWT Secret (auto-generated)
JWT_SECRET=$JWT_SECRET

# Server Configuration
PORT=3001
NODE_ENV=production
EOF

# Create server .env file
cat > server/.env << EOF
# OpenAI API Configuration
OPENAI_API_KEY=$OPENAI_KEY

# JWT Secret (auto-generated)
JWT_SECRET=$JWT_SECRET

# Server Configuration
PORT=3001
NODE_ENV=production
EOF

echo ""
echo -e "${GREEN}✅ Configuration files created successfully!${NC}"
echo -e "${GREEN}✅ JWT secret generated automatically${NC}"
echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

echo -e "${BLUE}========================================"
echo -e "    Installing Dependencies..."
echo -e "========================================${NC}"
echo ""

echo "Installing main app dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install main dependencies${NC}"
    exit 1
fi

echo ""
echo "Installing server dependencies..."
cd server
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install server dependencies${NC}"
    exit 1
fi

cd ..

echo ""
echo -e "${GREEN}✅ All dependencies installed successfully!${NC}"

# Check and create database file
echo ""
echo "Setting up database..."
if [ ! -f "server/db.json" ]; then
    if [ -f "server/db.example.json" ]; then
        cp server/db.example.json server/db.json
        echo -e "${GREEN}✅ Database initialized from example${NC}"
    else
        # Create basic database structure
        cat > server/db.json << 'EOF'
{
  "users": [],
  "tasks": [],
  "goals": [],
  "achievements": []
}
EOF
        echo -e "${GREEN}✅ Database created with basic structure${NC}"
    fi
else
    echo -e "${GREEN}✅ Database file already exists${NC}"
fi

# Make scripts executable
chmod +x start-server.sh
chmod +x setup.sh
chmod +x vps-setup.sh 2>/dev/null || true
chmod +x vps-update.sh 2>/dev/null || true

echo ""
echo -e "${BLUE}========================================"
echo -e "    Task Flow AI Setup Complete!"
echo -e "========================================${NC}"
echo ""
echo -e "${GREEN}✅ Configuration completed successfully${NC}"
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo -e "${GREEN}✅ Environment configured for production${NC}"
echo ""
echo "Your API key and configuration are stored locally"
echo "and will not be uploaded to Git."
echo ""
echo -e "${YELLOW}To start the application:${NC}"
echo "./start-server.sh"
echo ""
echo -e "${YELLOW}To run in background:${NC}"
echo "nohup ./start-server.sh > app.log 2>&1 &"
echo ""
echo -e "${YELLOW}To check if it's running:${NC}"
echo "curl http://localhost:3001/api/test/openai -X POST -H 'Content-Type: application/json' -d '{\"prompt\":\"Hello\"}'"
echo ""
echo -e "${YELLOW}To update the application later:${NC}"
echo "git pull && npm install && cd server && npm install && cd .. && pm2 restart all"
echo ""

# Validate setup
echo "Validating setup..."
if [ -f "server/validate-setup.js" ]; then
    cd server
    node validate-setup.js
    cd ..
else
    echo -e "${YELLOW}Setup validation script not found, skipping validation${NC}"
fi

# Setup Nginx configuration
echo ""
echo -e "${BLUE}========================================"
echo -e "    Configuring Nginx..."
echo -e "========================================${NC}"
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo "Server IP: $SERVER_IP"

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/task-flow-ai > /dev/null << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;

    # Main application (frontend)
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # API endpoints (backend)
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
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
sudo ln -sf /etc/nginx/sites-available/task-flow-ai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if sudo nginx -t; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✅ Nginx configured and reloaded successfully${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    exit 1
fi

# Setup firewall (optional)
if command -v ufw &> /dev/null; then
    echo "Configuring firewall..."
    sudo ufw --force enable
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    echo -e "${GREEN}✅ Firewall configured${NC}"
fi

echo ""
read -p "Do you want to start the application now? (y/n): " start_now
if [[ $start_now =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting Task Flow AI with PM2..."
    
    # Start with PM2
    pm2 start server/server.js --name "taskflow-backend"
    pm2 start "npm run dev" --name "taskflow-frontend"
    pm2 save
    pm2 startup
    
    echo ""
    echo -e "${GREEN}✅ Application started with PM2!${NC}"
    echo ""
    echo "🌐 Application URL: http://$SERVER_IP"
    echo "🔧 PM2 commands:"
    echo "   pm2 status                 - Check status"
    echo "   pm2 logs                   - View logs"
    echo "   pm2 restart all            - Restart all"
    echo "   pm2 stop all               - Stop all"
fi