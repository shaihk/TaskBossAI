#!/bin/bash

# TaskBoss-AI - Pre-deployment Check Script
# This script validates all dependencies and configuration files

set -e

echo "========================================="
echo "    TaskBoss-AI - Pre-deployment Check"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

# Function to print colored output
print_status() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓ PASS]${NC} $1"
    ((CHECKS_PASSED++))
}

print_warning() {
    echo -e "${YELLOW}[⚠ WARN]${NC} $1"
    ((WARNINGS++))
}

print_error() {
    echo -e "${RED}[✗ FAIL]${NC} $1"
    ((CHECKS_FAILED++))
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check 1: Project structure
print_status "Checking project structure..."

if [ -f "package.json" ]; then
    print_success "Main package.json found"
else
    print_error "Main package.json not found"
fi

if [ -d "server" ]; then
    print_success "Server directory exists"
    
    if [ -f "server/package.json" ]; then
        print_success "Server package.json found"
    else
        print_error "Server package.json not found"
    fi
    
    if [ -f "server/server.js" ]; then
        print_success "Server main file (server.js) found"
    else
        print_error "Server main file (server.js) not found"
    fi
else
    print_error "Server directory not found"
fi

if [ -d "src" ]; then
    print_success "Source directory exists"
else
    print_warning "Source directory not found (may be normal for some setups)"
fi

# Check 2: Environment files
print_status "Checking environment configuration..."

if [ -f ".env" ]; then
    print_success "Main .env file found"
    
    # Check for required environment variables
    if grep -q "OPENAI_API_KEY" .env; then
        if grep -q "^OPENAI_API_KEY=sk-" .env; then
            print_success "OpenAI API key format appears valid"
        else
            print_error "OpenAI API key format invalid (should start with 'sk-')"
        fi
    else
        print_error "OPENAI_API_KEY not found in .env"
    fi
    
    if grep -q "JWT_SECRET" .env; then
        JWT_SECRET_LENGTH=$(grep "JWT_SECRET=" .env | cut -d'=' -f2 | wc -c)
        if [ $JWT_SECRET_LENGTH -gt 20 ]; then
            print_success "JWT_SECRET appears to be properly configured"
        else
            print_warning "JWT_SECRET may be too short (should be at least 20 characters)"
        fi
    else
        print_error "JWT_SECRET not found in .env"
    fi
    
    if grep -q "PORT" .env; then
        print_success "PORT configuration found"
    else
        print_warning "PORT not specified in .env (will use default)"
    fi
    
    if grep -q "NODE_ENV" .env; then
        print_success "NODE_ENV configuration found"
    else
        print_warning "NODE_ENV not specified in .env"
    fi
else
    print_error "Main .env file not found"
fi

if [ -f "server/.env" ]; then
    print_success "Server .env file found"
else
    print_warning "Server .env file not found (may be created during setup)"
fi

# Check 3: Database files
print_status "Checking database configuration..."

if [ -f "server/db.json" ]; then
    print_success "Database file (db.json) found"
    
    # Check if it's valid JSON
    if python3 -m json.tool server/db.json > /dev/null 2>&1 || node -e "JSON.parse(require('fs').readFileSync('server/db.json', 'utf8'))" > /dev/null 2>&1; then
        print_success "Database file is valid JSON"
    else
        print_error "Database file contains invalid JSON"
    fi
elif [ -f "server/db.example.json" ]; then
    print_warning "Database file not found, but example file exists (will be copied during setup)"
    
    # Check if example is valid JSON
    if python3 -m json.tool server/db.example.json > /dev/null 2>&1 || node -e "JSON.parse(require('fs').readFileSync('server/db.example.json', 'utf8'))" > /dev/null 2>&1; then
        print_success "Database example file is valid JSON"
    else
        print_error "Database example file contains invalid JSON"
    fi
else
    print_error "No database file or example found"
fi

# Check 4: Required scripts
print_status "Checking deployment scripts..."

REQUIRED_SCRIPTS=("setup.sh" "vps-setup.sh" "start-server.sh" "stop.sh" "status.sh")

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        print_success "Script $script found"
        
        # Check if executable
        if [ -x "$script" ]; then
            print_success "Script $script is executable"
        else
            print_warning "Script $script is not executable (will be fixed during setup)"
        fi
    else
        print_error "Required script $script not found"
    fi
done

# Check 5: Git configuration
print_status "Checking Git configuration..."

if [ -d ".git" ]; then
    print_success "Git repository initialized"
    
    # Check for .gitignore
    if [ -f ".gitignore" ]; then
        print_success ".gitignore file found"
        
        # Check if .env files are ignored
        if grep -q "\.env" .gitignore; then
            print_success ".env files are properly ignored in Git"
        else
            print_warning ".env files may not be ignored in Git (security risk)"
        fi
        
        # Check if node_modules is ignored
        if grep -q "node_modules" .gitignore; then
            print_success "node_modules is properly ignored"
        else
            print_warning "node_modules may not be ignored in Git"
        fi
    else
        print_warning ".gitignore file not found"
    fi
    
    # Check for uncommitted changes
    if git diff --quiet && git diff --staged --quiet; then
        print_success "No uncommitted changes"
    else
        print_warning "There are uncommitted changes"
    fi
    
    # Check remote origin
    if git remote get-url origin > /dev/null 2>&1; then
        REMOTE_URL=$(git remote get-url origin)
        print_success "Git remote origin configured: $REMOTE_URL"
    else
        print_warning "Git remote origin not configured"
    fi
else
    print_error "Git repository not initialized"
fi

# Check 6: Node.js dependencies
print_status "Checking Node.js dependencies..."

if [ -f "package.json" ]; then
    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        print_success "Main dependencies installed (node_modules exists)"
    else
        print_warning "Main dependencies not installed (run 'npm install')"
    fi
    
    # Check for package-lock.json
    if [ -f "package-lock.json" ]; then
        print_success "Package lock file found"
    else
        print_warning "Package lock file not found (run 'npm install')"
    fi
fi

if [ -f "server/package.json" ]; then
    if [ -d "server/node_modules" ]; then
        print_success "Server dependencies installed"
    else
        print_warning "Server dependencies not installed (run 'npm install' in server directory)"
    fi
    
    if [ -f "server/package-lock.json" ]; then
        print_success "Server package lock file found"
    else
        print_warning "Server package lock file not found"
    fi
fi

# Check 7: Configuration files
print_status "Checking configuration files..."

if [ -f "eslint.config.js" ]; then
    print_success "ESLint configuration found"
else
    print_warning "ESLint configuration not found"
fi

if [ -f "ecosystem.config.cjs" ] || [ -f "ecosystem.config.js" ]; then
    print_success "PM2 ecosystem configuration found"
    
    # Check if it's the correct format (.cjs for CommonJS)
    if [ -f "ecosystem.config.cjs" ]; then
        print_success "PM2 config uses correct .cjs extension"
    else
        print_warning "PM2 config should use .cjs extension for compatibility"
    fi
else
    print_warning "PM2 ecosystem configuration not found (will be created during VPS setup)"
fi

# Check 8: Security considerations
print_status "Checking security configuration..."

# Check for sensitive files that shouldn't be in Git
SENSITIVE_FILES=(".env" "server/.env" "*.key" "*.pem" "*.p12")

for pattern in "${SENSITIVE_FILES[@]}"; do
    if git ls-files | grep -q "$pattern" 2>/dev/null; then
        print_error "Sensitive file pattern '$pattern' found in Git repository"
    fi
done

# Check file permissions on sensitive files
if [ -f ".env" ]; then
    PERM=$(stat -c "%a" .env 2>/dev/null || stat -f "%A" .env 2>/dev/null || echo "unknown")
    if [ "$PERM" = "600" ] || [ "$PERM" = "0600" ]; then
        print_success ".env file has secure permissions (600)"
    else
        print_warning ".env file permissions should be 600 (current: $PERM)"
    fi
fi

# Check 9: Port availability (if running locally)
print_status "Checking port configuration..."

DEFAULT_PORT=3001
if [ -f ".env" ] && grep -q "PORT=" .env; then
    PORT=$(grep "PORT=" .env | cut -d'=' -f2)
else
    PORT=$DEFAULT_PORT
fi

print_info "Application configured to run on port $PORT"

# Check if port is in use (only if netstat/ss is available)
if command -v netstat > /dev/null 2>&1; then
    if netstat -tuln | grep -q ":$PORT "; then
        print_warning "Port $PORT appears to be in use"
    else
        print_success "Port $PORT appears to be available"
    fi
elif command -v ss > /dev/null 2>&1; then
    if ss -tuln | grep -q ":$PORT "; then
        print_warning "Port $PORT appears to be in use"
    else
        print_success "Port $PORT appears to be available"
    fi
else
    print_info "Cannot check port availability (netstat/ss not available)"
fi

# Final report
echo ""
echo "========================================="
echo "           PRE-CHECK REPORT"
echo "========================================="
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    print_success "All critical checks passed! ✅"
    echo ""
    print_info "Your project appears ready for deployment."
    
    if [ $WARNINGS -gt 0 ]; then
        echo ""
        print_warning "Note: $WARNINGS warning(s) found. Review above for details."
        echo "These warnings won't prevent deployment but should be addressed."
    fi
    
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Commit any remaining changes: git add . && git commit -m 'Ready for deployment'"
    echo "   2. Push to repository: git push origin main"
    echo "   3. Run VPS setup: sudo ./vps-setup.sh"
    echo ""
    
    exit 0
else
    print_error "$CHECKS_FAILED critical issue(s) found! ❌"
    echo ""
    print_error "Please fix the issues above before deploying."
    
    if [ $WARNINGS -gt 0 ]; then
        echo ""
        print_warning "Additionally, $WARNINGS warning(s) should be reviewed."
    fi
    
    echo ""
    echo "🔧 Common fixes:"
    echo "   • Missing .env: Copy from .env.example and configure"
    echo "   • Missing dependencies: Run 'npm install' in root and server directories"
    echo "   • Invalid JSON: Check db.json and db.example.json syntax"
    echo "   • Git issues: Initialize repository and add remote origin"
    echo ""
    
    exit 1
fi