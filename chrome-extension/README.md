# Secure Share Chrome Extension

A Chrome extension for sharing sensitive data securely via ephemeral WebSocket channels with end-to-end encryption.

## 🚀 Features

- **🔐 Zero persistence** — everything stays in RAM and expires
- **🕸 WebSocket-based ephemeral channels** for instant sharing
- **🔄 Broadcast logic** to multiple connected clients
- **⏱ TTL auto-cleanup** to wipe rooms automatically (5 minutes)
- **🔗 Chrome extension** for direct integration into day-to-day work
- **📋 Text selection sharing** via context menu and keyboard shortcuts
- **🔒 End-to-end encryption** (AES-GCM / ECDH) between clients
- **⚡ Real-time messaging** through WebSocket connections
- **📋 Copy room IDs** to clipboard for easy sharing

## 🎯 Use Cases

- **Developers** sharing API keys, tokens, or passwords
- **Support teams** sharing temporary access credentials
- **Operations teams** sharing configuration snippets
- **Security teams** sharing incident details
- **Anyone** who currently shares secrets via Slack, Teams, or Jira

## 📦 Installation

### Prerequisites

1. Make sure the Ephero WebSocket server is running:

   ```bash
   cd server
   npm start
   ```

2. The server should be running on `ws://localhost:8080`

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder from this project
5. The extension should now appear in your extensions list

## 🎮 Usage

### Basic Sharing

1. Click the Secure Share extension icon in your Chrome toolbar
2. Click "Create Room" to create a new ephemeral room
3. Share the room ID with others who need to join
4. Type messages in the text area and press Ctrl+Enter to send
5. Others can join using the "Join Room" button and entering the room ID

### Text Selection Sharing

1. **Right-click method**: Select any text on a webpage, right-click, and choose "Share securely with Secure Share"
2. **Keyboard shortcut**: Select text and press `Ctrl+Shift+S` for quick sharing
3. The selected text will automatically populate the message input
4. Create or join a room to share the selected content

### Context Menu Integration

- Right-click on any selected text to access the secure sharing option
- The extension will highlight the selected text briefly
- A notification will appear confirming the text is ready for sharing

## 🏗 Architecture

### File Structure

```
chrome-extension/
├── manifest.json      # Extension manifest (Manifest V3)
├── popup.html        # Main popup interface
├── popup.css         # Styles for the popup
├── popup.js          # JavaScript functionality
├── background.js     # Service worker for background tasks
├── content.js        # Content script for webpage integration
├── icon.svg          # SVG icon source
├── ephero.png        # PNG icon for the extension
└── README.md         # This file
```

### Security Features

- **Ephemeral rooms** with automatic cleanup after 5 minutes
- **No persistent message storage** - everything stays in memory
- **WebSocket connections** for real-time communication
- **Randomly generated room IDs** for security
- **Messages only visible** to room participants
- **End-to-end encryption** between clients
- **Zero database storage** - no logs or disk writes

## 🧪 Testing

1. Start the WebSocket server:

   ```bash
   cd server
   npm start
   ```

2. Load the extension in Chrome (see Installation above)

3. Test the functionality:
   - Create a room and verify the room ID is displayed
   - Copy the room ID and share it
   - Open another browser/incognito window and join the room
   - Send messages between the two instances
   - Test text selection sharing on any webpage
   - Wait 5 minutes to test room expiration

### Advanced Testing

- **Text selection**: Select text on any webpage and use right-click or Ctrl+Shift+S
- **Context menu**: Verify the "Share securely" option appears
- **Keyboard shortcuts**: Test Ctrl+Shift+S for quick sharing
- **Auto-fill**: Check that selected text populates the message input

## 🔧 Development

### Debugging

- Open Chrome DevTools for the popup by right-clicking the extension icon and selecting "Inspect popup"
- Check the browser console for WebSocket connection logs
- Verify the server is running and accessible at `ws://localhost:8080`
- Use the background page console for service worker debugging

### Permissions

The extension requires:

- `storage`: For saving room IDs and pending shares
- `clipboardWrite`: For copying room IDs to clipboard
- `activeTab`: For accessing current tab content
- `host_permissions`: For WebSocket connections

## 🚨 Troubleshooting

### Extension not loading

- Make sure Developer mode is enabled
- Check that all files are present in the chrome-extension folder
- Verify the manifest.json is valid JSON

### Connection issues

- Ensure the WebSocket server is running on port 8080
- Check that the server URL in popup.js matches your server
- Verify firewall settings allow localhost connections

### Text selection not working

- Check that content.js is properly loaded
- Verify the extension has activeTab permission
- Try refreshing the webpage after installing the extension

### Messages not sending

- Check that you're connected to a room
- Verify the WebSocket connection status
- Check browser console for error messages

## 🔒 Security Notes

- **No data persistence**: All messages are ephemeral and never stored
- **Memory-only storage**: Server keeps nothing on disk
- **Automatic cleanup**: Rooms expire after 5 minutes of inactivity
- **Encrypted communication**: End-to-end encryption between clients
- **Random room IDs**: No predictable patterns for room identification

## 📄 License

MIT License - Open source and self-hostable
