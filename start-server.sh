#!/bin/bash

echo "Starting Task Flow AI Backend Server..."
echo "=================================="

# Navigate to server directory
cd "$(dirname "$0")/server"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing server dependencies..."
    npm install
fi

# Start the server
echo "Starting server on port 3001..."
node server.js