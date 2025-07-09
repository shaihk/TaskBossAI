# TaskMaster AI

A smart task and goal management system with AI integration.

## Setup

### Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Fill in your API keys and configuration:
```bash
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_strong_random_jwt_secret
```

⚠️ **SECURITY WARNING**: Never commit the `.env` file to version control. It contains sensitive API keys.

### Installation

```bash
npm install
```

### Running the app

Development mode:
```bash
npm run dev
```

Start the backend server:
```bash
cd server
node server.js
```

### Building the app

```bash
npm run build
```

## Security Notes

- Always use environment variables for sensitive data
- The `.env` file is gitignored for security
- Use strong, unique JWT secrets in production
- Rotate API keys regularly"# TaskBossAI" 
