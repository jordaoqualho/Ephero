# Ephero Secure Sharing Flow Test

## 🎯 Complete Flow Test

### 1. **Start the Server**

```bash
cd server && node dist/index.js
```

Server should show:

```
🚀 Starting Ephero server on port 4000
⏰ Room TTL: 5 minutes
🎉 HTTP server running at http://localhost:4000
🎉 WebSocket server running at ws://localhost:4000
```

### 2. **Test the Extension**

1. Open the Chrome extension popup
2. Enter sensitive text in the textarea
3. Click "Share Securely"
4. The extension will:
   - Connect to WebSocket on port 4000
   - Create a room and get room ID
   - Encrypt the text with AES-GCM
   - Send encrypted data to server
   - Generate a secure link like: `http://localhost:4000/#roomId:key`
   - Copy the link to clipboard
   - Show "Link copied!" message

### 3. **Test the Web Client**

1. Open the generated link in a new browser tab
2. The web client will:
   - Parse roomId and AES key from URL hash
   - Connect to WebSocket
   - Send join-room message
   - Receive encrypted payload
   - Decrypt with AES key from URL
   - Display the original plaintext

### 4. **Test the "Open" Button**

1. In the extension popup, click the "Open" button
2. This will use `chrome.windows.create` to open the link in a new popup window
3. The window will be 800x600 and focused

## 🔒 Security Features

- **AES-GCM Encryption**: Text is encrypted with AES-GCM before sending to server
- **Key Never Sent**: The AES key is never transmitted to the server
- **Auto-Expiry**: Rooms automatically expire after 5 minutes
- **Ephemeral**: Data is stored temporarily and deleted when room expires

## 🎨 UI Improvements

### Dark Theme Features:

- Modern dark color scheme (#1a1a1a, #2a2a2a, #2d3748)
- Gradient backgrounds and hover effects
- Improved typography and spacing
- Custom scrollbars
- Smooth animations and transitions
- Better visual hierarchy

### New Features:

- "Open" button to open links in new windows
- Improved status indicators
- Better error handling and user feedback
- Responsive design elements

## 🧪 Manual Test Steps

1. **Load Extension**: Load the extension in Chrome
2. **Enter Text**: Type "Hello, this is a secret message!" in the textarea
3. **Share**: Click "Share Securely"
4. **Copy Link**: The link should be copied to clipboard
5. **Open Link**: Click "Open" to open in new window
6. **Verify**: The decrypted text should appear in the web client

## 🔧 Troubleshooting

If the flow doesn't work:

1. Check server is running on port 4000
2. Verify WebSocket connection in browser dev tools
3. Check console for any JavaScript errors
4. Ensure the extension has proper permissions

## 📝 Notes

- The server runs on port 4000 to avoid conflicts
- All communication uses WebSocket for real-time updates
- The AES key is generated client-side and never sent to server
- Links are in format: `http://localhost:4000/#roomId:base64Key`
