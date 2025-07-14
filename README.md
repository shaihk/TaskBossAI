# TaskBoss-AI

A modern task management application with AI-powered features for productivity enhancement.

## Features

- 📝 Task Management with categories and priorities
- 🎯 Goal Setting and tracking
- 🤖 AI Assistant for task suggestions and consultation
- 📊 Progress tracking and statistics
- 🏆 Achievement system
- 🌐 Multi-language support (English/Hebrew)
- 🎨 Modern UI with dark/light theme

## Quick Start

### Windows Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd TaskBossAI
   ```

2. **Run the setup script:**
   ```bash
   setup.bat
   ```

3. **Regular usage:**
   ```bash
   setrun.bat
   ```

### Ubuntu/Linux Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shaihk/TaskBossAI.git
   cd TaskBossAI
   ```

2. **Run the setup script (includes all dependencies):**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

The setup script will automatically:
- Install Node.js, npm, Git, curl, Nginx, and PM2 if missing
- Install all application dependencies
- Create environment files with your OpenAI API key
- Initialize the database
- Configure Nginx with security headers and rate limiting
- Setup firewall rules
- Start the application with PM2
- Validate the setup

3. **After setup, the application runs automatically with PM2 and Nginx**

**Pre-deployment validation:**
```bash
./pre-check.sh             # Validate dependencies and configuration before deployment
```

**Regular usage commands:**
```bash
./status.sh                # Check application status (comprehensive)
./stop.sh                  # Stop all application processes
./start-server.sh          # Start application
pm2 status                 # Check PM2 status
pm2 logs                   # View PM2 logs
pm2 restart all            # Restart application
```

**Access your application:**
- Your application will be available at: `http://your-server-ip`
- Nginx handles routing automatically
- Both frontend and backend run through port 80

### Fresh Installation (Clean Start)

If you want to start completely fresh:

1. **Remove existing installation:**
   ```bash
   rm -rf TaskBossAI
   ```

2. **Clone and setup:**
   ```bash
   git clone https://github.com/shaihk/TaskBossAI.git
   cd TaskBossAI
   chmod +x setup.sh
   ./setup.sh
   ```

This ensures you get all the latest updates and a clean configuration.

### What the setup script does:
- Guide you through OpenAI API key configuration
- Validate your API key
- Generate secure JWT secrets
- Create environment files
- Install Node.js (Ubuntu/Linux only)
- Install dependencies
- Start the application

### Get your OpenAI API Key:
- Visit: https://platform.openai.com/account/api-keys
- Sign in to your OpenAI account
- Click "Create new secret key"
- Copy the key (starts with `sk-...`)

## Manual Setup (Advanced)

If you prefer manual setup:

1. **Install dependencies:**
   ```bash
   npm install
   cd server
   npm install
   cd ..
   ```

2. **Create environment files:**
   
   Create `.env` in root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   JWT_SECRET=your_secure_jwt_secret_here
   PORT=3001
   NODE_ENV=development
   ```
   
   Create `server/.env` with the same content.

3. **Start the servers:**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm start
   
   # Terminal 2 - Frontend
   npm run dev
   ```

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for AI features
- `JWT_SECRET`: Secret key for JWT token generation (auto-generated)
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)

### Security

- Environment files (`.env`) are automatically excluded from Git
- Each deployment uses its own API keys and secrets
- JWT secrets are auto-generated for security

### 🔒 Git Security - Important!

**Before pushing to Git, ensure sensitive data is protected:**

1. **Check what will be committed:**
   ```bash
   git status
   ```

2. **Verify sensitive files are ignored:**
   - `.env` files should NOT appear in git status
   - Both `server/db.json` and `server/db.example.json` are safe to track

3. **If sensitive files appear in git status:**
   ```bash
   # Remove from Git tracking (keeps local file)
   git rm --cached .env
   git rm --cached server/.env
   ```

4. **Safe commit process:**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

**Protected files (automatically ignored):**
- `.env` and `server/.env` - Contains API keys
- `*.log` files - Contains runtime logs
- `node_modules/` - Dependencies

**Safe files to commit:**
- `.env.example` - Template without real keys
- `server/db.json` - Database with application data
- `server/db.example.json` - Database structure template

## Development

### Project Structure

```
TaskBossAI/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   └── utils/             # Utility functions
├── server/                # Backend Node.js server
│   ├── server.js          # Main server file
│   ├── validate-setup.js  # Setup validation
│   └── db.json           # JSON database
├── setup.bat             # First-time setup script
├── setrun.bat           # Regular startup script
└── README.md            # This file
```

### API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/tasks` - Get user tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/llm/invoke` - AI assistant
- `POST /api/chat` - AI chat

### AI Features

The application includes several AI-powered features:

- **Task Assistant**: Suggests tasks based on user input
- **Task Planning**: Helps break down large tasks
- **Consultation**: Provides productivity advice
- **Smart Categorization**: Auto-categorizes tasks

## Deployment

### Local Development (Windows)
```bash
setup.bat          # First time setup
setrun.bat         # Regular usage
```

### Local Development (Ubuntu/Linux)
```bash
chmod +x setup.sh start-server.sh
./setup.sh         # First time setup
./start-server.sh  # Regular usage
```

### Production Deployment (Ubuntu/Linux VPS)

**🚀 Automated VPS Setup (Recommended)**

Use our comprehensive VPS setup script that includes Nginx, SSL, security, and PM2:

1. **Validate your setup before deployment (recommended):**
   ```bash
   ./pre-check.sh
   ```
   This will check all dependencies, configuration files, and project structure.

2. **Upload and run the VPS setup script:**
   ```bash
   sudo chmod +x vps-setup.sh
   sudo ./vps-setup.sh
   ```

The script will:
- Install Node.js, Git, PM2, and Nginx
- Clone your repository
- Setup environment variables securely
- Configure Nginx with security headers and rate limiting
- Setup SSL certificate (optional)
- Configure firewall
- Start the application with PM2

**🔄 Updating Your VPS Application**

**Option 1: Automated Update (Recommended)**

Use the automated update script:

1. **Upload the update script to your VPS:**
   ```bash
   scp vps-update.sh your-username@your-vps-ip:/tmp/
   ```

2. **Connect to your VPS and run the update:**
   ```bash
   ssh your-username@your-vps-ip
   sudo chmod +x /tmp/vps-update.sh
   sudo /tmp/vps-update.sh
   ```

The script will automatically:
- Create a backup of current state
- Pull latest changes from Git
- Update dependencies
- Restart the application with PM2
- Test the application
- Reload Nginx configuration

**Option 2: Manual Update**

1. **Connect to your VPS:**
   ```bash
   ssh your-username@your-vps-ip
   ```

2. **Navigate to application directory:**
   ```bash
   cd /var/www/taskboss-ai
   ```

3. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

4. **Update dependencies:**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

5. **Restart the application:**
   ```bash
   pm2 restart taskboss-ai
   ```

6. **Check status:**
   ```bash
   pm2 status
   pm2 logs taskboss-ai --lines 20
   ```

**📋 Manual VPS Setup**

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd TaskBossAI
   chmod +x setup.sh start-server.sh
   ./setup.sh
   ```

2. **Run in background:**
   ```bash
   nohup ./start-server.sh > app.log 2>&1 &
   ```

3. **Check if running:**
   ```bash
   curl http://localhost:3001/api/test/openai -X POST -H 'Content-Type: application/json' -d '{"prompt":"Hello"}'
   ```

4. **Stop the application:**
   ```bash
   pkill -f "node.*server.js"
   pkill -f "npm.*dev"
   ```

5. **View logs:**
   ```bash
   tail -f app.log
   ```

### Using PM2 (Recommended for Production)

1. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

2. **Create PM2 ecosystem file:**
   ```bash
   cat > ecosystem.config.js << 'EOF'
   module.exports = {
     apps: [{
       name: 'taskflow-ai',
       script: 'server/server.js',
       cwd: '/path/to/TaskBossAI',
       env: {
         NODE_ENV: 'production',
         PORT: 3001
       },
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G'
     }]
   };
   EOF
   ```

3. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Nginx Configuration (Optional)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Common Issues

1. **AI features not working:**
   - Check if OpenAI API key is valid
   - Ensure you have sufficient OpenAI credits
   - Run setup.bat to reconfigure

2. **Server won't start:**
   - Check if ports 3001 and 5173 are available
   - Verify environment files exist
   - Run setup validation: `node server/validate-setup.js`

3. **Authentication issues:**
   - Check JWT_SECRET configuration
   - Clear browser localStorage and re-login

### Getting Help

If you encounter issues:
1. Check the console for error messages
2. Verify your OpenAI API key at: https://platform.openai.com/account/api-keys
3. Run the setup script again to reconfigure

## License

This project is licensed under the MIT License.
