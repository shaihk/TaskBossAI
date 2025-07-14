#!/bin/bash

# Task Flow AI - VPS Update Script
# This script updates the application on your VPS

set -e  # Exit on any error

echo "========================================="
echo "    Task Flow AI - VPS Update Script"
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

# Default application directory
APP_DIR="/var/www/task-flow-ai"

# Check if custom directory is provided
if [ ! -z "$1" ]; then
    APP_DIR="$1"
fi

print_status "Updating Task Flow AI application..."
print_status "Application directory: $APP_DIR"

# Check if directory exists
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory not found: $APP_DIR"
    print_error "Please run the VPS setup script first or provide correct path:"
    print_error "Usage: $0 [/path/to/app]"
    exit 1
fi

# Navigate to application directory
cd "$APP_DIR"

# Check if it's a git repository
if [ ! -d ".git" ]; then
    print_error "Not a git repository. Please ensure the application was installed correctly."
    exit 1
fi

# Step 1: Backup current state (optional)
print_status "Creating backup of current state..."
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "../$BACKUP_DIR"
cp -r . "../$BACKUP_DIR/" 2>/dev/null || print_warning "Backup creation failed, continuing..."

# Step 2: Stop the application
print_status "Stopping application..."
if command -v pm2 &> /dev/null; then
    pm2 stop task-flow-ai 2>/dev/null || print_warning "Application may not be running"
else
    print_warning "PM2 not found, skipping application stop"
fi

# Step 3: Pull latest changes
print_status "Pulling latest changes from Git..."
git fetch origin
git pull origin main

if [ $? -eq 0 ]; then
    print_success "Code updated successfully"
else
    print_error "Git pull failed. Please check for conflicts."
    exit 1
fi

# Step 4: Update dependencies
print_status "Updating Node.js dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Main dependencies updated"
else
    print_warning "Main dependency update failed"
fi

# Update server dependencies
if [ -d "server" ] && [ -f "server/package.json" ]; then
    print_status "Updating server dependencies..."
    cd server
    npm install
    cd ..
    
    if [ $? -eq 0 ]; then
        print_success "Server dependencies updated"
    else
        print_warning "Server dependency update failed"
    fi
fi

# Step 5: Check for environment file updates
print_status "Checking environment configuration..."
if [ -f ".env.example" ] && [ -f ".env" ]; then
    # Check if .env.example has new variables
    NEW_VARS=$(comm -23 <(grep -o '^[^#]*=' .env.example | sort) <(grep -o '^[^#]*=' .env | sort) 2>/dev/null || echo "")
    if [ ! -z "$NEW_VARS" ]; then
        print_warning "New environment variables detected in .env.example:"
        echo "$NEW_VARS"
        print_warning "Please update your .env file manually if needed"
    fi
fi

# Step 6: Set proper permissions
print_status "Setting proper permissions..."
chown -R www-data:www-data . 2>/dev/null || print_warning "Could not set www-data ownership"
chmod -R 755 .
chmod 600 .env 2>/dev/null || true
chmod 600 server/.env 2>/dev/null || true

# Step 7: Test the application
print_status "Testing application..."
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
        print_warning "Application test failed. Check configuration."
        cd ..
    fi
fi

# Step 8: Restart the application
print_status "Starting application..."
if command -v pm2 &> /dev/null; then
    pm2 start task-flow-ai 2>/dev/null || pm2 restart task-flow-ai
    
    # Wait a moment for startup
    sleep 3
    
    # Check if application is running
    if pm2 list | grep -q "task-flow-ai.*online"; then
        print_success "Application restarted successfully"
    else
        print_error "Application failed to start. Check PM2 logs:"
        print_error "pm2 logs task-flow-ai"
        exit 1
    fi
else
    print_warning "PM2 not found. Please start the application manually."
fi

# Step 9: Test Nginx (if available)
if command -v nginx &> /dev/null; then
    print_status "Testing Nginx configuration..."
    if nginx -t 2>/dev/null; then
        systemctl reload nginx 2>/dev/null || print_warning "Could not reload Nginx"
        print_success "Nginx configuration is valid"
    else
        print_warning "Nginx configuration test failed"
    fi
fi

# Step 10: Final status check
print_status "Checking final status..."
sleep 2

if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 list | grep task-flow-ai | grep online || echo "")
    if [ -n "$PM2_STATUS" ]; then
        print_success "Application is running successfully!"
    else
        print_warning "Application may not be running. Check PM2 status."
    fi
fi

# Get application URL
if command -v nginx &> /dev/null && systemctl is-active --quiet nginx; then
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
    print_success "Application should be accessible at: http://$SERVER_IP"
else
    print_success "Application is running on port 3001"
fi

echo ""
echo "========================================="
echo "           UPDATE COMPLETE!"
echo "========================================="
echo ""
print_success "Task Flow AI has been updated successfully!"
echo ""
echo "🔧 Useful commands:"
echo "   pm2 status                 - Check application status"
echo "   pm2 logs task-flow-ai      - View application logs"
echo "   pm2 restart task-flow-ai   - Restart application"
echo "   pm2 monit                  - Monitor application"
echo ""
echo "📁 Backup created at: ../$BACKUP_DIR"
echo "📁 Application directory: $APP_DIR"
echo ""
print_success "Update completed successfully! 🚀"