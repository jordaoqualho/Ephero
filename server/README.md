# Ephero Server

A WebSocket-based real-time communication server with ephemeral rooms and automatic cleanup.

## Features

- **Ephemeral Rooms**: Rooms are automatically destroyed after a configurable period of inactivity
- **Real-time Communication**: WebSocket-based messaging between clients
- **Automatic Cleanup**: Memory-efficient with automatic room expiration
- **Configurable TTL**: Customizable time-to-live for rooms

## Configuration

### Environment Variables

- `PORT`: Server port (default: 8080)
- `ROOM_TTL_MINUTES`: Room time-to-live in minutes (default: 30)

### Example

```bash
# Start server with 15-minute room TTL
ROOM_TTL_MINUTES=15 PORT=3000 npm start

# Start server with default settings
npm start
```

## TTL (Time-To-Live) System

The server implements an automatic room cleanup system to ensure:

- **Memory Efficiency**: Rooms are automatically destroyed after inactivity
- **Security**: No lingering rooms that could accidentally expose data
- **Resource Management**: Automatic cleanup prevents memory leaks

### How it Works

1. **Activity Tracking**: Room activity is updated when:

   - Clients join/leave the room
   - Messages are broadcasted in the room

2. **Automatic Expiration**: Rooms are marked for expiration after the configured TTL period

3. **Cleanup Process**: A background process runs every 30 seconds to:

   - Check for expired rooms
   - Notify clients before destroying rooms
   - Clean up resources

4. **Client Notification**: When a room expires, all connected clients receive an error message

### Room Lifecycle

1. **Creation**: Room is created with current timestamp and TTL
2. **Activity**: Any client interaction resets the activity timer
3. **Expiration**: After TTL period of inactivity, room is marked for cleanup
4. **Destruction**: Room is destroyed and clients are notified

## API

### WebSocket Messages

- `CREATE_ROOM`: Create a new room
- `JOIN_ROOM`: Join an existing room
- `LEAVE_ROOM`: Leave current room
- `GET_ROOMS`: Get list of active rooms
- `MESSAGE`: Broadcast message to room

### Room Information

Each room includes:

- `id`: Unique room identifier
- `clientsCount`: Number of connected clients
- `createdAt`: Room creation timestamp
- `timeUntilExpiration`: Time remaining before expiration (in milliseconds)

## Development

### Running Tests

```bash
npm test
```

### Running with Development Mode

```bash
npm run dev
```

## Security Considerations

- Rooms are ephemeral and automatically cleaned up
- No persistent data storage
- Automatic resource management
- Client notifications on room expiration
