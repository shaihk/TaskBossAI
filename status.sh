#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e "    Task Flow AI - Status Check"
echo -e "========================================${NC}"
echo ""

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

# Check PM2 status
if command -v pm2 &> /dev/null; then
    echo -e "${BLUE}📊 PM2 Status:${NC}"
    pm2 status
    echo ""
else
    print_warning "PM2 not installed"
fi

# Check Node.js processes
echo -e "${BLUE}🔍 Node.js Processes:${NC}"
NODE_PROCESSES=$(ps aux | grep -E "(node.*server|npm.*dev|vite)" | grep -v grep || echo "")

if [ -n "$NODE_PROCESSES" ]; then
    echo "$NODE_PROCESSES"
else
    print_warning "No Node.js processes found"
fi

echo ""

# Check specific application processes
echo -e "${BLUE}🎯 Application Status:${NC}"

# Check backend
BACKEND_RUNNING=$(ps aux | grep -E "node.*(server\.js|server/server\.js)" | grep -v grep || echo "")
if [ -n "$BACKEND_RUNNING" ]; then
    print_success "🧠 Backend is running"
else
    print_error "🧠 Backend NOT running"
fi

# Check frontend
FRONTEND_RUNNING=$(ps aux | grep -E "(npm.*dev|vite)" | grep -v grep || echo "")
if [ -n "$FRONTEND_RUNNING" ]; then
    print_success "🎨 Frontend is running"
else
    print_error "🎨 Frontend NOT running"
fi

echo ""

# Check ports
echo -e "${BLUE}🌐 Port Status:${NC}"

# Check port 3001 (backend)
if netstat -tuln 2>/dev/null | grep -q ":3001 " || ss -tuln 2>/dev/null | grep -q ":3001 "; then
    print_success "Port 3001 (Backend) is active"
else
    print_error "Port 3001 (Backend) is not active"
fi

# Check port 5173 (frontend)
if netstat -tuln 2>/dev/null | grep -q ":5173 " || ss -tuln 2>/dev/null | grep -q ":5173 "; then
    print_success "Port 5173 (Frontend) is active"
else
    print_error "Port 5173 (Frontend) is not active"
fi

# Check port 80 (Nginx)
if netstat -tuln 2>/dev/null | grep -q ":80 " || ss -tuln 2>/dev/null | grep -q ":80 "; then
    print_success "Port 80 (Nginx) is active"
else
    print_warning "Port 80 (Nginx) is not active"
fi

echo ""

# Check Nginx status
if command -v nginx &> /dev/null; then
    echo -e "${BLUE}🔧 Nginx Status:${NC}"
    if systemctl is-active --quiet nginx 2>/dev/null; then
        print_success "Nginx is running"
    else
        print_error "Nginx is not running"
    fi
else
    print_warning "Nginx not installed"
fi

echo ""

# Show recent logs if available
echo -e "${BLUE}📄 Recent Logs:${NC}"

if [ -f "server.log" ]; then
    echo -e "${YELLOW}--- server.log (last 5 lines) ---${NC}"
    tail -5 server.log 2>/dev/null || echo "Could not read server.log"
fi

if [ -f "frontend.log" ]; then
    echo -e "${YELLOW}--- frontend.log (last 5 lines) ---${NC}"
    tail -5 frontend.log 2>/dev/null || echo "Could not read frontend.log"
fi

if [ -f "app.log" ]; then
    echo -e "${YELLOW}--- app.log (last 5 lines) ---${NC}"
    tail -5 app.log 2>/dev/null || echo "Could not read app.log"
fi

# PM2 logs if available
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}--- PM2 logs (last 10 lines) ---${NC}"
    pm2 logs --lines 10 --nostream 2>/dev/null || echo "No PM2 logs available"
fi

echo ""

# Quick connectivity test
echo -e "${BLUE}🔗 Connectivity Test:${NC}"

# Test backend
if curl -s http://localhost:3001/api/test >/dev/null 2>&1; then
    print_success "Backend API is responding"
else
    print_error "Backend API is not responding"
fi

# Test frontend
if curl -s http://localhost:5173 >/dev/null 2>&1; then
    print_success "Frontend is responding"
else
    print_error "Frontend is not responding"
fi

echo ""
echo -e "${BLUE}========================================"
echo -e "           Status Check Complete"
echo -e "========================================${NC}"