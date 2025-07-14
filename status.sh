#!/bin/bash

# TaskBoss-AI - System Status Check (VPS)
# This script checks the status of all TaskBoss-AI components on VPS

echo "========================================"
echo "    TaskBoss-AI - System Status (VPS)"
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

# Check application installation
check_installation() {
    echo "Installation Status:"
    
    if [[ -d "$APP_DIR" ]]; then
        print_status "Application directory exists: $APP_DIR"
    else
        print_error "Application directory not found: $APP_DIR"
        return 1
    fi
    
    if [[ -f "$APP_DIR/.env" ]]; then
        print_status "Main configuration file exists"
    else
        print_error "Main configuration file missing"
    fi
    
    if [[ -f "$APP_DIR/server/.env" ]]; then
        print_status "Server configuration file exists"
    else
        print_error "Server configuration file missing"
    fi
    
    echo
}

# Check database status
check_database() {
    echo "Database Status:"
    
    if [[ -f "$APP_DIR/server/taskboss.db" ]]; then
        local db_size=$(stat -c%s "$APP_DIR/server/taskboss.db" 2>/dev/null || echo "unknown")
        print_status "SQLite database exists"
        echo "  Size: $db_size bytes"
        echo "  Location: $APP_DIR/server/taskboss.db"
        
        # Check database permissions
        if [[ -r "$APP_DIR/server/taskboss.db" && -w "$APP_DIR/server/taskboss.db" ]]; then
            print_status "Database permissions are correct"
        else
            print_warning "Database permissions may be incorrect"
        fi
    else
        print_error "SQLite database not found"
    fi
    
    echo
}

# Check dependencies
check_dependencies() {
    echo "Dependencies Status:"
    
    if [[ -d "$APP_DIR/node_modules" ]]; then
        print_status "Frontend dependencies installed"
    else
        print_error "Frontend dependencies missing"
    fi
    
    if [[ -d "$APP_DIR/server/node_modules" ]]; then
        print_status "Server dependencies installed"
    else
        print_error "Server dependencies missing"
    fi
    
    # Check if SQLite3 is installed
    if [[ -d "$APP_DIR/server/node_modules/sqlite3" ]]; then
        print_status "SQLite3 dependency installed"
    else
        print_error "SQLite3 dependency missing"
    fi
    
    echo
}

# Check system services
check_services() {
    echo "System Services Status:"
    
    # Check nginx
    if systemctl is-active --quiet nginx; then
        print_status "Nginx is running"
        echo "  Status: $(systemctl is-active nginx)"
        echo "  Enabled: $(systemctl is-enabled nginx)"
    else
        print_error "Nginx is not running"
        echo "  Status: $(systemctl is-active nginx)"
    fi
    
    # Check PM2
    if command -v pm2 >/dev/null 2>&1; then
        print_status "PM2 is installed"
        if pm2 list | grep -q "$APP_NAME"; then
            local pm2_status=$(pm2 list | grep "$APP_NAME" | awk '{print $10}')
            if [[ "$pm2_status" == "online" ]]; then
                print_status "TaskBoss-AI application is running in PM2"
            else
                print_warning "TaskBoss-AI application is in PM2 but not online (status: $pm2_status)"
            fi
        else
            print_error "TaskBoss-AI application not found in PM2"
        fi
    else
        print_error "PM2 is not installed"
    fi
    
    echo
}

# Check network and ports
check_network() {
    echo "Network Status:"
    
    # Check if backend port is listening
    if netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then
        print_status "Backend port $PORT is listening"
        local process=$(netstat -tlnp 2>/dev/null | grep ":$PORT " | awk '{print $7}')
        echo "  Process: $process"
    else
        print_error "Backend port $PORT is not listening"
    fi
    
    # Check if nginx is listening on port 80
    if netstat -tlnp 2>/dev/null | grep -q ":80 "; then
        print_status "Nginx is listening on port 80"
    else
        print_error "Port 80 is not listening (nginx may not be running)"
    fi
    
    # Check if port 443 is listening (SSL)
    if netstat -tlnp 2>/dev/null | grep -q ":443 "; then
        print_status "SSL is configured (port 443 listening)"
    else
        print_warning "SSL not configured (port 443 not listening)"
    fi
    
    echo
}

# Check application health
check_health() {
    echo "Application Health:"
    
    # Try to connect to backend
    if curl -s --max-time 5 http://localhost:$PORT >/dev/null 2>&1; then
        print_status "Backend is responding on port $PORT"
    else
        print_warning "Backend is not responding on port $PORT"
    fi
    
    # Check if frontend files exist
    if [[ -d "$APP_DIR/dist" ]]; then
        print_status "Frontend build files exist"
    else
        print_error "Frontend build files not found"
    fi
    
    echo
}

# Show logs
show_logs() {
    echo "Recent Logs:"
    
    if [[ -d "$APP_DIR/logs" ]]; then
        echo "  Log directory: $APP_DIR/logs/"
        ls -la "$APP_DIR/logs/" 2>/dev/null || echo "  No log files found"
        
        # Show last few lines of error log if it exists
        if [[ -f "$APP_DIR/logs/err.log" ]]; then
            echo
            echo "  Last 5 lines of error log:"
            tail -5 "$APP_DIR/logs/err.log" 2>/dev/null | sed 's/^/    /'
        fi
    else
        print_warning "Log directory not found"
    fi
    
    # Show PM2 logs
    if command -v pm2 >/dev/null 2>&1 && pm2 list | grep -q "$APP_NAME"; then
        echo
        echo "  PM2 Logs (last 5 lines):"
        pm2 logs $APP_NAME --lines 5 --nostream 2>/dev/null | sed 's/^/    /' || echo "    No PM2 logs available"
    fi
    
    echo
}

# Show system information
show_system_info() {
    echo "System Information:"
    
    # Node.js version
    if command -v node >/dev/null 2>&1; then
        print_status "Node.js version: $(node --version)"
    else
        print_error "Node.js not found"
    fi
    
    # npm version
    if command -v npm >/dev/null 2>&1; then
        print_status "npm version: $(npm --version)"
    else
        print_error "npm not found"
    fi
    
    # PM2 version
    if command -v pm2 >/dev/null 2>&1; then
        print_status "PM2 version: $(pm2 --version)"
    else
        print_error "PM2 not found"
    fi
    
    # Nginx version
    if command -v nginx >/dev/null 2>&1; then
        print_status "Nginx version: $(nginx -v 2>&1 | cut -d' ' -f3)"
    else
        print_error "Nginx not found"
    fi
    
    # System uptime
    print_info "System uptime: $(uptime -p)"
    
    # Disk usage
    local disk_usage=$(df -h "$APP_DIR" 2>/dev/null | tail -1 | awk '{print $5}' || echo "unknown")
    print_info "Disk usage: $disk_usage"
    
    echo
}

# Show URLs and commands
show_info() {
    echo "Application URLs:"
    
    # Get domain from nginx config if available
    local domain=$(grep -oP 'server_name \K[^;]*' /etc/nginx/sites-available/$APP_NAME 2>/dev/null | head -1 | awk '{print $1}' || echo "your-domain.com")
    
    echo "  Frontend: http://$domain"
    echo "  Backend API: http://$domain/api"
    echo "  Local Backend: http://localhost:$PORT"
    echo
    
    echo "Useful Commands:"
    echo "  run.sh                    - Start all servers"
    echo "  stop.sh                   - Stop all servers"
    echo "  setup.sh                  - Complete setup"
    echo "  pm2 logs $APP_NAME        - View application logs"
    echo "  pm2 restart $APP_NAME     - Restart application"
    echo "  pm2 monit                 - Monitor PM2 processes"
    echo "  sudo systemctl status nginx - Check nginx status"
    echo "  sudo systemctl reload nginx - Reload nginx config"
    echo
    
    echo "Configuration Files:"
    echo "  Application: $APP_DIR"
    echo "  Nginx config: /etc/nginx/sites-available/$APP_NAME"
    echo "  Environment: $APP_DIR/.env"
    echo "  Database: $APP_DIR/server/taskboss.db"
    echo "  Logs: $APP_DIR/logs/"
    echo
}

# Main execution
main() {
    print_info "Checking TaskBoss-AI system status..."
    echo
    
    check_installation
    check_database
    check_dependencies
    check_services
    check_network
    check_health
    show_logs
    show_system_info
    show_info
    
    echo "========================================"
    echo "    Status Check Complete"
    echo "========================================"
}

# Run main function
main "$@"