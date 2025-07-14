# TaskBoss-AI

TaskBoss-AI is a comprehensive task and goal management application with AI-powered assistance. The application uses React for the frontend, Express.js for the backend, and SQLite for data storage.

## 🚀 Quick Start

### Local Development (Windows)

1. **Complete Setup** (first time):
   ```bash
   setup.bat
   ```
   This will install all dependencies, configure the database, and start the servers.

2. **Start Servers** (after setup):
   ```bash
   run.bat
   ```

3. **Stop Servers**:
   ```bash
   stop.bat
   ```

4. **Check Status**:
   ```bash
   status.bat
   ```

### VPS Deployment (Linux)

1. **Complete Setup** (first time):
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   This will install all dependencies, configure nginx, set up PM2, and deploy the application.

2. **Start Servers** (after setup):
   ```bash
   ./run.sh
   ```

3. **Stop Servers**:
   ```bash
   ./stop.sh
   ```

4. **Check Status**:
   ```bash
   ./status.sh
   ```

## 📁 File Structure

### Setup Scripts
- **`setup.bat`** - Complete Windows setup (installs dependencies, configures database, starts servers)
- **`setup.sh`** - Complete VPS setup (installs dependencies, configures nginx/PM2, deploys application)

### Runtime Scripts
- **`run.bat`** - Start servers locally (Windows)
- **`run.sh`** - Start servers on VPS (Linux)
- **`stop.bat`** - Stop all servers locally (Windows)
- **`stop.sh`** - Stop all servers on VPS (Linux)
- **`status.bat`** - Check system status locally (Windows)
- **`status.sh`** - Check system status on VPS (Linux)

### Database Helper Scripts
- **`server/migrate-from-json.js`** - Migrate data from JSON to SQLite
- **`server/create-new-db.js`** - Create new SQLite database

### Core Application
- **`server/`** - Backend Express.js application
  - **`server.js`** - Main server file
  - **`database.js`** - SQLite database helper functions
  - **`taskboss.db`** - SQLite database file
  - **`package.json`** - Server dependencies
- **`src/`** - Frontend React application
- **`package.json`** - Frontend dependencies

## 🔧 Configuration

### Environment Variables

The setup scripts automatically create `.env` files with the following variables:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your-api-key-here

# JWT Secret (auto-generated)
JWT_SECRET=auto-generated-secret

# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_PATH=./server/taskboss.db
```

### Database

TaskBoss-AI uses SQLite for data storage with the following tables:
- **users** - User accounts and authentication
- **goals** - User goals and objectives
- **tasks** - Individual tasks linked to goals
- **user_stats** - User statistics and achievements

## 🌐 Application URLs

### Local Development
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### VPS Deployment
- Frontend: http://your-domain.com
- Backend API: http://your-domain.com/api

## 📋 Requirements

### Local Development (Windows)
- Node.js 18+ and npm
- Windows 10/11
- OpenAI API key

### VPS Deployment (Linux)
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+ and npm
- nginx
- PM2
- OpenAI API key
- Domain name (optional, for SSL)

## 🔄 Migration from JSON

If you have an existing JSON database (`server/db.json`), the setup scripts will automatically migrate your data to SQLite while preserving all:
- User accounts and passwords
- Goals and tasks
- User statistics and achievements
- Hebrew/RTL content

## 🛠️ Troubleshooting

### Common Issues

1. **Port already in use**:
   - Run `stop.bat` (Windows) or `./stop.sh` (Linux) to stop all servers
   - Check `status.bat` or `./status.sh` for detailed information

2. **Database not found**:
   - Run the complete setup script again
   - Check if `server/taskboss.db` exists

3. **Dependencies missing**:
   - Delete `node_modules` folders and run setup script again
   - Ensure you have Node.js 18+ installed

4. **API key issues**:
   - Verify your OpenAI API key starts with `sk-`
   - Check `.env` files for correct configuration

### Logs and Debugging

#### Local Development
- Check terminal output where servers are running
- Look for error messages in the command windows

#### VPS Deployment
- Application logs: `pm2 logs taskboss-ai`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- System status: `./status.sh`

## 🔒 Security

- Environment variables are stored locally and not committed to Git
- JWT tokens are auto-generated with high entropy
- SQLite database is stored locally with appropriate permissions
- nginx configuration includes security headers
- Firewall is configured to allow only necessary ports

## 📈 Performance

### SQLite Benefits
- Faster queries compared to JSON file storage
- ACID compliance for data integrity
- Automatic indexing on primary keys
- Efficient storage and retrieval
- Support for complex queries

### Production Optimizations
- Frontend is built and served as static files
- nginx handles static file serving and API proxying
- PM2 manages process monitoring and auto-restart
- Gzip compression enabled
- Static asset caching configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with both `setup.bat` and `setup.sh`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
1. Check the troubleshooting section above
2. Run `status.bat` or `./status.sh` for system diagnostics
3. Check application logs for error details
4. Ensure all requirements are met

---

**TaskBoss-AI** - Manage your tasks and goals with AI-powered assistance! 🎯
