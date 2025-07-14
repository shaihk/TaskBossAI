#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo -e "    Task Flow AI - Starting Server"
echo -e "========================================${NC}"
echo ""

# Check if configuration files exist
if [ ! -f ".env" ] || [ ! -f "server/.env" ]; then
    echo -e "${RED}❌ Configuration files not found!${NC}"
    echo "Please run setup.sh first to configure the application."
    echo ""
    echo -e "${YELLOW}Run: ./setup.sh${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Please run setup.sh to install Node.js and configure the application."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing main app dependencies...${NC}"
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo -e "${YELLOW}Installing server dependencies...${NC}"
    cd server
    npm install
    cd ..
fi

echo -e "${GREEN}Starting Task Flow AI...${NC}"
echo ""

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the backend server
echo -e "${BLUE}Starting backend server...${NC}"
cd server
npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for the backend to start
echo "Waiting for backend server to initialize..."
sleep 5

# Check if backend is running
if ! curl -s http://localhost:3001/api/test/openai -X POST -H 'Content-Type: application/json' -d '{"prompt":"test"}' > /dev/null 2>&1; then
    echo -e "${YELLOW}Backend server is starting up...${NC}"
    sleep 3
fi

# Start the frontend development server (only in development)
if [ "$NODE_ENV" != "production" ]; then
    echo -e "${BLUE}Starting frontend development server...${NC}"
    npm run dev &
    FRONTEND_PID=$!
    
    echo ""
    echo -e "${GREEN}========================================"
    echo -e "    Task Flow AI is running!"
    echo -e "========================================${NC}"
    echo -e "${GREEN}✅ Backend server: http://localhost:3001${NC}"
    echo -e "${GREEN}✅ Frontend server: http://localhost:5173${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
    
    # Wait for both processes
    wait $BACKEND_PID $FRONTEND_PID
else
    echo ""
    echo -e "${GREEN}========================================"
    echo -e "    Task Flow AI Backend is running!"
    echo -e "========================================${NC}"
    echo -e "${GREEN}✅ Backend server: http://localhost:3001${NC}"
    echo ""
    echo -e "${YELLOW}Running in production mode (backend only)${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    
    # Wait for backend process
    wait $BACKEND_PID
fi