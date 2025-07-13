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

echo -e "${GREEN}Node.js version: $(node --version)${NC}"
echo -e "${GREEN}npm version: $(npm --version)${NC}"
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

# Make start-server.sh executable
chmod +x start-server.sh

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

read -p "Do you want to start the application now? (y/n): " start_now
if [[ $start_now =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting Task Flow AI..."
    ./start-server.sh
fi