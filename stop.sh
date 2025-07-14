#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e "    TaskBoss-AI - Stop Script"
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

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    print_status "Stopping PM2 processes..."
    
    # Stop specific processes
    pm2 stop taskboss-ai 2>/dev/null || true
    pm2 stop taskflow-backend 2>/dev/null || true
    pm2 stop taskflow-frontend 2>/dev/null || true
    
    # Stop all PM2 processes
    pm2 stop all 2>/dev/null || true
    
    print_success "PM2 processes stopped"
else
    print_warning "PM2 not found, trying to stop Node.js processes manually..."
fi

# Stop Node.js processes manually
print_status "Stopping Node.js processes..."

# Kill server processes
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "node.*server/server.js" 2>/dev/null || true

# Kill frontend processes
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Kill any remaining node processes related to the app
pkill -f "TaskBossAI" 2>/dev/null || true
pkill -f "taskboss-ai" 2>/dev/null || true

print_success "Node.js processes stopped"

# Check if any processes are still running
print_status "Checking for remaining processes..."
REMAINING=$(ps aux | grep -E "(node.*server|npm.*dev|vite)" | grep -v grep || echo "")

if [ -z "$REMAINING" ]; then
    print_success "All application processes stopped successfully!"
else
    print_warning "Some processes may still be running:"
    echo "$REMAINING"
fi

echo ""
echo -e "${GREEN}✅ TaskBoss-AI stopped successfully!${NC}"
echo ""
echo -e "${YELLOW}To start again:${NC}"
echo "./start-server.sh"
echo ""
echo -e "${YELLOW}To check status:${NC}"
echo "./status.sh"