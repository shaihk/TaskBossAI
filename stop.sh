#!/bin/bash

# TaskBoss-AI - Stop All Servers (VPS)
# This script stops all TaskBoss-AI services on VPS

echo "========================================"
echo "    TaskBoss-AI - Stop All Servers"
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

# Stop PM2 processes
stop_pm2() {
    print_info "Stopping PM2 processes..."
    
    if pm2 list | grep -q "$APP_NAME"; then
        pm2 stop $APP_NAME
        print_status "PM2 application stopped"
    else
        print_warning "No PM2 processes found for $APP_NAME"
    fi
    
    # Optionally stop all PM2 processes
    read -p "Do you want to stop ALL PM2 processes? (y/n): " stop_all
    if [[ "$stop_all" =~ ^[Yy]$ ]]; then
        pm2 stop all
        print_status "All PM2 processes stopped"
    fi
}

# Stop nginx (optional)
stop_nginx() {
    read -p "Do you want to stop nginx? (y/n): " stop_nginx_choice
    
    if [[ "$stop_nginx_choice" =~ ^[Yy]$ ]]; then
        print_info "Stopping nginx..."
        sudo systemctl stop nginx
        if systemctl is-active --quiet nginx; then
            print_error "Failed to stop nginx"
        else
            print_status "Nginx stopped"
        fi
    else
        print_info "Nginx left running"
    fi
}

# Kill any remaining node processes
kill_remaining_processes() {
    print_info "Checking for remaining Node.js processes..."
    
    # Find and kill any remaining node processes
    if pgrep -f "node.*server" > /dev/null; then
        print_warning "Found remaining Node.js processes, killing them..."
        sudo pkill -f "node.*server"
        print_status "Remaining Node.js processes killed"
    else
        print_info "No remaining Node.js processes found"
    fi
}

# Show final status
show_status() {
    echo
    echo "========================================"
    echo "    Stop Operation Complete"
    echo "========================================"
    echo
    
    echo "Service Status:"
    
    # Check PM2 status
    if pm2 list | grep -q "$APP_NAME.*online"; then
        echo -e "  Application: ${YELLOW}Still Running${NC}"
    else
        echo -e "  Application: ${GREEN}Stopped${NC}"
    fi
    
    # Check nginx status
    if systemctl is-active --quiet nginx; then
        echo -e "  Nginx: ${GREEN}Running${NC}"
    else
        echo -e "  Nginx: ${RED}Stopped${NC}"
    fi
    
    echo
    echo "To start services again:"
    echo "  run.sh      - Start TaskBoss-AI servers"
    echo "  setup.sh    - Complete setup (if needed)"
    echo "  sudo systemctl start nginx - Start nginx manually"
    echo
    echo "To check status:"
    echo "  status.sh   - Check detailed status"
    echo "  pm2 list    - Check PM2 processes"
    echo "  sudo systemctl status nginx - Check nginx status"
    echo
}

# Main execution
main() {
    print_info "Stopping TaskBoss-AI services..."
    
    stop_pm2
    kill_remaining_processes
    stop_nginx
    show_status
    
    print_status "TaskBoss-AI services have been stopped!"
}

# Run main function
main "$@"