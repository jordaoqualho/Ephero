#!/bin/bash

echo "📦 Installing all dependencies for Ephero monorepo..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Install web-client dependencies
echo "📦 Installing web-client dependencies..."
cd web-client
npm install
cd ..

# Install chrome-extension dependencies
echo "📦 Installing chrome-extension dependencies..."
cd chrome-extension
npm install
cd ..

echo "✅ All dependencies installed successfully!"
echo ""
echo "Available scripts:"
echo "  npm run dev:all     - Start all services"
echo "  npm run dev:server  - Start only server"
echo "  npm run dev:web     - Start only web client"
echo "  npm run dev:extension - Start only extension"
echo ""
echo "Or use the bash scripts:"
echo "  ./scripts/dev-all.sh      - Start all services"
echo "  ./scripts/dev-server.sh   - Start only server"
echo "  ./scripts/dev-web.sh      - Start only web client"
echo "  ./scripts/dev-extension.sh - Start only extension" 