# TaskBoss-AI - VPS Deployment Guide

This guide will help you deploy your TaskBoss-AI application on a VPS server using nginx and pm2.

## Prerequisites

- A VPS server running Ubuntu 18.04+ or Debian 9+
- Root or sudo access to the server
- A domain name pointing to your server (optional but recommended)
- Your OpenAI API key

## Quick Deployment

### 1. Upload Files to VPS

Transfer your application files to your VPS server. You can use one of these methods:

**Option A: Using SCP/SFTP**
```bash
# From your local machine, upload the entire project
scp -r . username@your-server-ip:/home/username/taskboss-ai/
```

**Option B: Using Git**
```bash
# On your VPS server
git clone https://github.com/yourusername/taskboss-ai.git
cd taskboss-ai
```

### 2. Run the Setup Script

```bash
# Make the script executable
chmod +x setup-app.sh

# Run the setup script
./setup-app.sh
```

The script will:
- ✅ Update system packages
- ✅ Install Node.js 18.x and npm
- ✅ Install PM2 process manager
- ✅ Install and configure nginx
- ✅ Create application directory (`/var/www/taskboss-ai`)
- ✅ Prompt for your OpenAI API key
- ✅ Create environment files with secure JWT secret
- ✅ Copy application files
- ✅ Initialize database from `server/db.json`
- ✅ Install dependencies (frontend and backend)
- ✅ Build frontend application
- ✅ Configure nginx as reverse proxy
- ✅ Start application with PM2
- ✅ Configure firewall
- ✅ Optional: Setup SSL with Let's Encrypt

## What the Script Does

### System Setup
- Installs Node.js 18.x (LTS version)
- Installs PM2 for process management
- Installs nginx as reverse proxy
- Configures firewall (UFW)

### Application Setup
- Creates `/var/www/taskboss-ai` directory
- Copies your application files
- Creates production environment files:
  - `/var/www/taskboss-ai/.env`
  - `/var/www/taskboss-ai/server/.env`
- Installs npm dependencies
- Builds React frontend (`npm run build`)
- Preserves your existing `server/db.json` database

### Service Configuration
- **nginx**: Serves static files and proxies API requests
- **PM2**: Manages Node.js process with auto-restart
- **Firewall**: Allows HTTP (80), HTTPS (443), and SSH

## Environment Configuration

The script creates these environment files:

**Main `.env` file:**
```env
OPENAI_API_KEY=your_api_key_here
JWT_SECRET=auto_generated_secure_secret
PORT=3001
NODE_ENV=production
```

**Server `.env` file:**
```env
OPENAI_API_KEY=your_api_key_here
JWT_SECRET=auto_generated_secure_secret
PORT=3001
NODE_ENV=production
```

## nginx Configuration

The script configures nginx to:
- Serve React static files from `/var/www/taskboss-ai/dist`
- Proxy API requests to backend on port 3001
- Handle client-side routing (SPA support)
- Enable gzip compression
- Add security headers
- Cache static assets

## PM2 Configuration

Creates `ecosystem.config.js` with:
- Process name: `taskboss-ai`
- Auto-restart on crashes
- Memory limit: 1GB
- Log files in `./logs/` directory

## Post-Deployment

### Access Your Application
- **Frontend**: `http://your-domain.com`
- **API**: `http://your-domain.com/api`

### Useful Commands

```bash
# View application logs
pm2 logs taskboss-ai

# Restart application
pm2 restart taskboss-ai

# Stop application
pm2 stop taskboss-ai

# Check PM2 status
pm2 status

# Reload nginx
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Management

Your database is stored at `/var/www/taskboss-ai/server/db.json`. To backup:

```bash
# Create backup
cp /var/www/taskboss-ai/server/db.json /var/www/taskboss-ai/server/db.backup.$(date +%Y%m%d_%H%M%S).json

# Restore from backup
cp /var/www/taskboss-ai/server/db.backup.YYYYMMDD_HHMMSS.json /var/www/taskboss-ai/server/db.json
pm2 restart taskboss-ai
```

## SSL Setup (Optional)

The script offers to setup SSL with Let's Encrypt. If you skipped it, you can run:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs taskboss-ai

# Check if port 3001 is in use
sudo netstat -tlnp | grep 3001

# Restart application
pm2 restart taskboss-ai
```

### nginx Issues
```bash
# Test nginx configuration
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx
```

### Database Issues
```bash
# Check database file permissions
ls -la /var/www/taskboss-ai/server/db.json

# Fix permissions if needed
sudo chown www-data:www-data /var/www/taskboss-ai/server/db.json
```

### OpenAI API Issues
```bash
# Test API key
curl -H "Authorization: Bearer YOUR_API_KEY" https://api.openai.com/v1/models

# Check environment variables
pm2 env taskboss-ai
```

## Security Considerations

- ✅ JWT secrets are auto-generated and secure
- ✅ Environment files are protected
- ✅ Firewall is configured
- ✅ nginx security headers are enabled
- ✅ Application runs as non-root user
- ⚠️ Consider setting up SSL certificate
- ⚠️ Regular database backups recommended
- ⚠️ Keep system packages updated

## Updating the Application

To update your application:

```bash
# Stop the application
pm2 stop taskboss-ai

# Backup database
cp /var/www/taskboss-ai/server/db.json ~/db.backup.json

# Update application files
cd /var/www/taskboss-ai
# Upload new files or pull from git

# Install new dependencies
npm install
cd server && npm install && cd ..

# Rebuild frontend
npm run build

# Restart application
pm2 restart taskboss-ai
```

## Support

If you encounter issues:

1. Check the logs: `pm2 logs taskboss-ai`
2. Verify nginx config: `sudo nginx -t`
3. Check system resources: `htop` or `free -h`
4. Ensure all services are running: `pm2 status` and `sudo systemctl status nginx`

The setup script creates a production-ready deployment with proper process management, reverse proxy, and security configurations.