# Ephero Chrome Extension

Ephero is a Chrome extension for ephemeral and secure sharing of sensitive information, 100% client-side, with no server.

## How it works

- Data is encrypted locally with a random key.
- A secure link is generated containing the encrypted data and the key (in base64).
- Anyone with the link can decrypt and view the content only once.
- No data is persisted or sent to any server.

## Installation

1. Clone this repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Go to `chrome://extensions/` in Chrome, enable developer mode, and click "Load unpacked".
4. Select the `chrome-extension` folder.

## Usage

- Click the extension icon.
- Enter your sensitive text.
- Click "Share Securely".
- The secure link will be generated and copied to your clipboard.
- Share the link with anyone you want.
- When the link is opened, the content will be displayed securely and ephemerally.

## Main file structure

- `popup.html` / `popup.js`: Main extension interface.
- `crypto.js`: Encryption and decryption logic.
- `linkManager.js`: Secure link generation and parsing.
- `viewer.html` / `viewer.js`: Decrypted content viewer.
- `manifest.json`: Chrome extension manifest.

## Security

- All encryption/decryption is done locally.
- The decryption key is included in the link (anyone with the link can access the content).
- No data is saved or transmitted to any server.

---

This repository is a case study of a functional, simple, and secure Chrome extension for ephemeral sharing of information.
