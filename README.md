# Ephero

🔐 Ephero is a secure, ephemeral sharing tool for sensitive data (passwords, files, etc). No storage. Built with WebSocket + WebRTC.

## Project Structure

This is a monorepo containing:

- **`server/`** - Node.js WebSocket server
- **`chrome-extension/`** - Chrome browser extension
- **`web-client/`** - HTML+JS client for users without the extension

```
secure-share/
├── server/          # Node WebSocket server
├── chrome-extension/ # Código da extensão
├── web-client/      # Cliente HTML+JS para quem não usa extensão
├── README.md
├── LICENSE
└── docker-compose.yml
```

## Features

- Secure, temporary sharing of sensitive information
- No data is stored on the server
- Real-time communication using WebSocket
- Chrome extension for easy access
- Web client for users without the extension

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed
- [Docker](https://docker.com/) (optional, for containerized development)

### Installation

#### Option 1: Local Development

```bash
# Install all dependencies
npm run install:all

# Start the WebSocket server
npm run dev:server

# Start the web client (in another terminal)
npm run dev:web
```

#### Option 2: Docker Development

```bash
# Start all services with Docker Compose
docker-compose up
```

### Development Scripts

#### NPM Scripts

- `npm run dev` - Start the WebSocket server
- `npm run dev:server` - Start only the server
- `npm run dev:web` - Start only the web client
- `npm run dev:extension` - Start only the Chrome extension
- `npm run dev:all` - Start all services simultaneously
- `npm run build` - Build all projects
- `npm run test` - Run tests for all projects
- `npm run install:all` - Install dependencies for all projects

#### Bash Scripts

- `./scripts/dev-all.sh` - Start all services with colored output
- `./scripts/dev-server.sh` - Start only the server
- `./scripts/dev-web.sh` - Start only the web client
- `./scripts/dev-extension.sh` - Start only the Chrome extension
- `./scripts/install-all.sh` - Install all dependencies with helpful output

## Individual Projects

### Server (`/server`)

WebSocket server running on port 8080.

```bash
cd server
npm run start:dev
```

### Web Client (`/web-client`)

HTML+JS client for users without the Chrome extension.

```bash
cd web-client
npm run dev
```

### Chrome Extension (`/chrome-extension`)

Browser extension for Chrome/Chromium-based browsers.

```bash
cd chrome-extension
# Load the extension in Chrome's developer mode
```

## API Documentation

### WebSocket Server

- **URL**: `ws://localhost:8080`
- **Protocol**: WebSocket
- **Features**: Real-time messaging, ephemeral data sharing

## License

MIT
