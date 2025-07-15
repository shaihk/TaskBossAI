#!/bin/bash

echo "🛑 Stopping existing servers..."
kill $(lsof -t -i:3001) 2>/dev/null
kill $(lsof -t -i:5173) 2>/dev/null

echo "🚀 Starting servers..."
(cd server && npm start &)
(npm run dev &)

echo "✅ Servers are restarting."
