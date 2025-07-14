#!/bin/bash

# TaskBoss-AI - Start Servers (VPS)
# This script starts the TaskBoss-AI application on VPS after initial setup

set -e  # Exit on any error

echo "========================================"
echo "    TaskBoss-AI - Start Servers (VPS)"
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
PORT=3001

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

# Check if application is set up
check_setup() {
    print_info "Checking application setup..."
    
    if [[ ! -d "$APP_DIR" ]]; then
        print_error "Application directory not found at $APP_DIR"
        print_info "Please run setup.sh first to set up the application."
        exit 1
    fi
    
    if [[ ! -f "$APP_DIR/.env" ]]; then
        print_error "Configuration file not found!"
        print_info "Please run setup.sh first to configure the application."
        exit 1
    fi
    
    if [[ ! -f "$APP_DIR/server/taskboss.db" ]]; then
        print_error "Database not found!"
        print_info "Please run setup.sh first to set up the database."
        exit 1
    fi
    
    if [[ ! -d "$APP_DIR/node_modules" ]]; then
        print_error "Dependencies not found!"
        print_info "Please run setup.sh first to install dependencies."
        exit 1
    fi
    
    print_status "Application setup verified"
}

# Check if nginx is running
check_nginx() {
    print_info "Checking nginx status..."
    
    if systemctl is-active --quiet nginx; then
        print_status "Nginx is running"
    else
        print_warning "Nginx is not running, starting..."
        sudo systemctl start nginx
        if systemctl is-active --quiet nginx; then
            print_status "Nginx started successfully"
        else
            print_error "Failed to start nginx"
            exit 1
        fi
    fi
}

# Start PM2 application
start_application() {
    print_info "Starting TaskBoss-AI application..."
    
    cd $APP_DIR
    
    # Check if PM2 process is already running
    if pm2 list | grep -q "$APP_NAME.*online"; then
        print_warning "Application is already running"
        print_info "Restarting application..."
        pm2 restart $APP_NAME
    else
        print_info "Starting new application instance..."
        pm2 start ecosystem.config.js
    fi
    
    # Save PM2 configuration
    pm2 save
    
    print_status "Application started successfully"
}

# Check application health
check_health() {
    print_info "Checking application health..."
    
    # Wait a moment for the application to start
    sleep 3
    
    # Check if the backend is responding
    if curl -s http://localhost:$PORT/api/health > /dev/null 2>&1; then
        print_status "Backend is responding on port $PORT"
    else
        print_warning "Backend health check failed, but this might be normal if no health endpoint exists"
    fi
    
    # Check PM2 status
    if pm2 list | grep -q "$APP_NAME.*online"; then
        print_status "PM2 process is running"
    else
        print_error "PM2 process is not running properly"
        pm2 logs $APP_NAME --lines 10
        exit 1
    fi
}

# Show final status
show_status() {
    echo
    echo "========================================"
    echo "    TaskBoss-AI is running!"
    echo "========================================"
    echo
    
    # Get domain from nginx config if available
    DOMAIN=$(grep -oP 'server_name \K[^;]*' /etc/nginx/sites-available/$APP_NAME 2>/dev/null | head -1 | awk '{print $1}' || echo "your-domain.com")
    
    echo "Application URLs:"
    echo "  Frontend: http://$DOMAIN"
    echo "  Backend API: http://$DOMAIN/api"
    echo "  Local Backend: http://localhost:$PORT"
    echo
    echo "Service Status:"
    
    # Check nginx status
    if systemctl is-active --quiet nginx; then
        echo -e "  Nginx: ${GREEN}Running${NC}"
    else
        echo -e "  Nginx: ${RED}Stopped${NC}"
    fi
    
    # Check PM2 status
    if pm2 list | grep -q "$APP_NAME.*online"; then
        echo -e "  Application: ${GREEN}Running${NC}"
    else
        echo -e "  Application: ${RED}Stopped${NC}"
    fi
    
    echo
    echo "Useful commands:"
    echo "  pm2 logs $APP_NAME    - View application logs"
    echo "  pm2 restart $APP_NAME - Restart application"
    echo "  pm2 stop $APP_NAME    - Stop application"
    echo "  stop.sh               - Stop all services"
    echo "  status.sh             - Check detailed status"
    echo "  sudo systemctl reload nginx - Reload nginx"
    echo
    echo "Configuration:"
    echo "  Application: $APP_DIR"
    echo "  Database: $APP_DIR/server/taskboss.db"
    echo "  Logs: $APP_DIR/logs/"
    echo
}

# Main execution
main() {
    print_info "Starting TaskBoss-AI servers..."
    
    check_setup
    check_nginx
    start_application
    check_health
    show_status
    
    print_status "TaskBoss-AI is now running on VPS!"
}

# Run main function
main "$@"