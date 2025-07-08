#!/bin/bash

echo "🚀 Starting all Ephero services..."
echo "📡 WebSocket Server: http://localhost:8080"
echo "🌐 Web Client: http://localhost:3000"
echo "🔧 Chrome Extension: Development mode"

# Check if concurrently is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not installed"
    exit 1
fi

# Start all services concurrently
npx concurrently \
  --names "server,web,extension" \
  --prefix-colors "blue,green,yellow" \
  "npm run dev:server" \
  "npm run dev:web" \
  "npm run dev:extension" 