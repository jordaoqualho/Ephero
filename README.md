# Ephero

🔐 Ephero is a secure, ephemeral sharing tool for sensitive data using client-side encryption. No server required. Built with Chrome extension and tweetnacl.

## Overview

Ephero provides secure, ephemeral data sharing without any server communication. All encryption and decryption happens locally using ephemeral keys, ensuring maximum privacy and security.

## Features

- **Client-side encryption** - No server communication required
- **Ephemeral keys** - Each share uses unique, temporary encryption keys
- **Zero persistence** - No data is stored anywhere
- **Chrome extension** - Easy-to-use browser integration
- **Secure by design** - Uses tweetnacl for cryptographic operations

## How It Works

1. **Key Generation**: When sharing data, Ephero generates a new ephemeral key pair
2. **Encryption**: The data is encrypted using the ephemeral public key
3. **Link Creation**: A secure link is created containing the encrypted data and ephemeral public key
4. **Sharing**: The link can be shared via any communication channel
5. **Decryption**: Recipients can decrypt the data using the ephemeral key from the link
6. **Cleanup**: All keys are immediately destroyed after use

## Project Structure

```
ephero/
├── chrome-extension/     # Chrome browser extension
│   ├── crypto.js        # Cryptographic operations
│   ├── linkManager.js   # Secure link generation/parsing
│   ├── popup.js         # Extension popup interface
│   ├── background.js    # Background service worker
│   ├── content.js       # Content script for text selection
│   ├── viewer.html      # Secure content viewer
│   └── manifest.json    # Extension manifest
├── README.md
└── LICENSE
```

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- Chrome or Chromium-based browser

### Setup

```bash
# Install dependencies
pnpm install

# Build the extension
pnpm run build:extension
```

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `chrome-extension/` folder
4. The Ephero extension should now appear in your extensions list

## Usage

### Sharing Sensitive Data

1. Click the Ephero extension icon in your browser
2. Enter the sensitive data you want to share
3. Click "Share Securely"
4. Copy the generated secure link
5. Share the link with your intended recipient

### Receiving Secure Data

1. Click on an Ephero secure link
2. The content will be automatically decrypted and displayed
3. The data is ephemeral and will be destroyed after viewing

### Keyboard Shortcuts

- `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac) - Share selected text

## Security Features

- **Ephemeral Keys**: Each share uses unique, temporary encryption keys
- **Client-side Only**: No server communication or data storage
- **Zero Persistence**: All data exists only in memory
- **Cryptographic Security**: Uses tweetnacl (NaCl) for encryption
- **Automatic Cleanup**: Keys are destroyed immediately after use

## Development

### Scripts

- `pnpm run dev:extension` - Development mode for the extension
- `pnpm run build:extension` - Build the extension
- `pnpm run test:extension` - Run tests

### Architecture

The extension is built with a modular architecture:

- **`crypto.js`** - Handles all cryptographic operations using tweetnacl
- **`linkManager.js`** - Manages secure link generation and parsing
- **`popup.js`** - Main extension interface
- **`background.js`** - Background service worker
- **`content.js`** - Content script for webpage integration

## Technical Details

### Cryptographic Implementation

- **Key Exchange**: X25519 for ephemeral key generation
- **Encryption**: NaCl secretbox (XSalsa20-Poly1305)
- **Key Derivation**: HKDF for shared key derivation
- **Randomness**: Uses Web Crypto API for secure random generation

### Link Format

Secure links follow the format:

```
ephero://secure/{base64-encoded-json}
```

The JSON contains:

- `ephemeralPublicKey`: The ephemeral public key used for encryption
- `encryptedData`: The encrypted content
- `nonce`: The encryption nonce
- `timestamp`: Link creation timestamp

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Security

If you discover any security vulnerabilities, please report them privately to the maintainers.
