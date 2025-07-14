#!/bin/bash

# TaskBoss-AI - Simple Start Script
# Quick start script for daily use after initial setup

set -e

echo "========================================"
echo "    TaskBoss-AI - Quick Start"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="taskboss-ai"
APP_DIR="/var/www/$APP_NAME"
PORT=3001

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Quick checks
if [[ ! -d "$APP_DIR" ]]; then
    print_error "Application not found. Run setup-root.sh first."
    exit 1
fi

cd $APP_DIR

# Start nginx if not running
if ! systemctl is-active --quiet nginx; then
    print_info "Starting nginx..."
    sudo systemctl start nginx
fi

# Start/restart application with PM2
print_info "Starting TaskBoss-AI..."

if pm2 list | grep -q "$APP_NAME.*online"; then
    print_info "Restarting existing application..."
    pm2 restart $APP_NAME
else
    print_info "Starting new application..."
    pm2 start ecosystem.config.cjs
fi

# Quick health check
sleep 3
if pm2 list | grep -q "$APP_NAME.*online"; then
    print_status "TaskBoss-AI is running!"
    
    # Test health endpoint
    if curl -s http://localhost:$PORT/api/health > /dev/null 2>&1; then
        print_status "Backend is healthy"
    fi
    
    echo
    echo "Application is ready at:"
    DOMAIN=$(grep -oP 'server_name \K[^;]*' /etc/nginx/sites-available/$APP_NAME 2>/dev/null | head -1 | awk '{print $1}' || echo "localhost")
    echo "  Frontend: http://$DOMAIN"
    echo "  Backend: http://$DOMAIN/api"
    echo
    echo "Use 'pm2 logs $APP_NAME' to view logs"
else
    print_error "Failed to start application"
    pm2 logs $APP_NAME --lines 5
    exit 1
fi