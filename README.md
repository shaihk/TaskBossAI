# Task Flow AI

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
   git clone <repository-url>
   cd TaskBossAI
   ```

2. **Make scripts executable:**
   ```bash
   chmod +x setup.sh start-server.sh
   ```

3. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

4. **Regular usage:**
   ```bash
   ./start-server.sh
   ```

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

1. **Upload and run the VPS setup script:**
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
