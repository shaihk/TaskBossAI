#!/bin/bash

# Deploy Database to VPS Script
# This script uploads your local database to the VPS server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo "========================================="
echo "    Deploy Database to VPS Script"
echo "========================================="
echo ""

# Check if db.json exists locally
if [ ! -f "server/db.json" ]; then
    print_error "Local database file server/db.json not found!"
    print_error "Please make sure you're running this script from the project root directory"
    exit 1
fi

# Get VPS details
echo "Please enter your VPS connection details:"
read -p "VPS IP address: " VPS_IP
read -p "VPS username (default: root): " VPS_USER
VPS_USER=${VPS_USER:-root}

# Ask for confirmation
echo ""
print_warning "This will upload your local database to the VPS server."
print_warning "The existing database on the VPS will be backed up first."
read -p "Continue? (y/n): " CONFIRM

if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    print_error "Deployment cancelled"
    exit 1
fi

# Define VPS paths
VPS_APP_DIR="/var/www/taskboss-ai"
VPS_DB_PATH="$VPS_APP_DIR/server/db.json"

print_status "Connecting to VPS and backing up existing database..."

# Create backup of existing database on VPS
ssh $VPS_USER@$VPS_IP "
    if [ -f '$VPS_DB_PATH' ]; then
        cp '$VPS_DB_PATH' '$VPS_DB_PATH.backup.\$(date +%Y%m%d_%H%M%S)'
        echo 'Database backed up successfully'
    else
        echo 'No existing database found on VPS'
    fi
"

print_status "Uploading local database to VPS..."

# Upload the database file
scp server/db.json $VPS_USER@$VPS_IP:$VPS_DB_PATH

print_status "Setting proper permissions..."

# Set proper permissions
ssh $VPS_USER@$VPS_IP "
    chown www-data:www-data '$VPS_DB_PATH'
    chmod 644 '$VPS_DB_PATH'
"

print_status "Restarting the application..."

# Restart the application
ssh $VPS_USER@$VPS_IP "
    cd '$VPS_APP_DIR'
    pm2 restart taskboss-ai
"

print_success "Database deployed successfully!"
echo ""
echo "📊 Your local database has been uploaded to the VPS"
echo "🔄 Application restarted with new database"
echo ""
print_status "You can verify the deployment by accessing your VPS application URL"