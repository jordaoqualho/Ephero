# Secure Share Chrome Extension

A Chrome extension for sharing sensitive data securely via ephemeral WebSocket channels.

## Features

- Create ephemeral rooms for secure data sharing
- Join existing rooms using room IDs
- Real-time messaging through WebSocket connections
- Automatic room expiration (5 minutes TTL)
- Copy room IDs to clipboard
- Modern, responsive UI

## Installation

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

## Usage

1. Click the Secure Share extension icon in your Chrome toolbar
2. Click "Create Room" to create a new ephemeral room
3. Share the room ID with others who need to join
4. Type messages in the text area and press Ctrl+Enter to send
5. Others can join using the "Join Room" button and entering the room ID

## Development

### File Structure

```
chrome-extension/
├── manifest.json      # Extension manifest (Manifest V3)
├── popup.html        # Main popup interface
├── popup.css         # Styles for the popup
├── popup.js          # JavaScript functionality
├── icon.svg          # SVG icon source
├── icon.png          # PNG icon for the extension
└── README.md         # This file
```

### Testing

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
   - Wait 5 minutes to test room expiration

### Debugging

- Open Chrome DevTools for the popup by right-clicking the extension icon and selecting "Inspect popup"
- Check the browser console for WebSocket connection logs
- Verify the server is running and accessible at `ws://localhost:8080`

## Security Features

- Ephemeral rooms with automatic cleanup
- No persistent message storage
- WebSocket connections for real-time communication
- Room IDs are randomly generated
- Messages are only visible to room participants

## Troubleshooting

### Extension not loading

- Make sure Developer mode is enabled
- Check that all files are present in the chrome-extension folder
- Verify the manifest.json is valid JSON

### Connection issues

- Ensure the WebSocket server is running on port 8080
- Check that the server URL in popup.js matches your server
- Verify firewall settings allow localhost connections

### Messages not sending

- Check that you're connected to a room
- Verify the WebSocket connection status
- Check browser console for error messages
