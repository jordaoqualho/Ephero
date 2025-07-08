# Room Features - Ephero WebSocket Server

## Overview

The Ephero WebSocket server implements a complete ephemeral room system with the following main features:

## ✅ Implemented Features

### 1. **Join Room by RoomId**

- Clients can join existing rooms using the room ID
- Complete validation of room existence and capacity
- Response with confirmation and client count

**Example:**

```javascript
// Join an existing room
ws.send(
  JSON.stringify({
    type: "join_room",
    roomId: "ABC12345",
  })
);
```

### 2. **Client Tracking**

- Real-time client count in the room
- Automatic notifications when clients join/leave
- Detailed information about each active room

**Tracking events:**

```javascript
// Client joined the room
{
  type: 'user_joined',
  userId: 'client123',
  timestamp: 1640995200000
}

// Client left the room
{
  type: 'user_left',
  userId: 'client123',
  timestamp: 1640995200000
}
```

### 3. **Data Broadcasting**

- Messages are sent to all clients in the room
- Automatic exclusion of sender (doesn't receive their own message)
- Support for different data types

**Broadcasting example:**

```javascript
// Send message to everyone in the room
ws.send(JSON.stringify({
  type: 'message',
  message: 'Encrypted data here'
}));

// Receive message (everyone except sender)
{
  type: 'message',
  userId: 'client123',
  message: 'Encrypted data here',
  timestamp: 1640995200000
}
```

## 🔧 Technical Implementation

### **Room Model**

```javascript
class Room {
  constructor(id) {
    this.id = id;
    this.clients = new Set(); // Client tracking
    this.maxClients = 10; // Maximum capacity
    this.ttl = 30 * 60 * 1000; // 30 minutes TTL
  }

  addClient(client) {
    /* ... */
  }
  removeClient(client) {
    /* ... */
  }
  broadcast(message, excludeClient) {
    /* ... */
  }
}
```

### **RoomService**

```javascript
class RoomService {
  addClientToRoom(roomId, client) {
    /* ... */
  }
  removeClientFromRoom(client) {
    /* ... */
  }
  getActiveRooms() {
    /* ... */
  }
}
```

### **MessageHandler**

```javascript
class MessageHandler {
  handleJoinRoom(client, data) {
    /* ... */
  }
  handleMessage(client, data) {
    /* ... */
  }
  handleLeaveRoom(client) {
    /* ... */
  }
}
```

## 🧪 Testing

### **Run Functionality Tests**

```bash
cd server
npm run test:room
```

### **Included Tests**

1. **Room Creation** - Verifies rooms are created correctly
2. **Join by RoomId** - Tests joining existing rooms
3. **Broadcasting** - Verifies messages reach all clients
4. **Tracking** - Confirms correct client counting
5. **Leave Room** - Tests leave notifications

## 📊 Data Flow

```
Client A                    Server                    Client B
    |                           |                           |
    |-- join_room(ABC123) ---->|                           |
    |<-- room_joined ----------|                           |
    |                           |-- user_joined ----------->|
    |                           |                           |
    |-- message("Hello") ------>|                           |
    |                           |-- message("Hello") ------>|
    |                           |                           |
    |-- leave_room ----------->|                           |
    |<-- room_left ------------|                           |
    |                           |-- user_left ------------->|
```

## 🔒 Security and Limitations

- **Automatic TTL**: Rooms expire after 30 minutes of inactivity
- **Automatic Cleanup**: Empty rooms are removed immediately
- **Limited Capacity**: Maximum of 10 clients per room
- **Unique IDs**: RoomIds are generated cryptographically
- **Validation**: All operations are validated on the server

## 🚀 How to Use

1. **Start the server:**

   ```bash
   npm run start:dev
   ```

2. **Connect via WebSocket:**

   ```javascript
   const ws = new WebSocket("ws://localhost:8080");
   ```

3. **Create or join a room:**

   ```javascript
   // Create room
   ws.send(JSON.stringify({ type: "create_room" }));

   // Join existing room
   ws.send(
     JSON.stringify({
       type: "join_room",
       roomId: "ABC12345",
     })
   );
   ```

4. **Send messages:**
   ```javascript
   ws.send(
     JSON.stringify({
       type: "message",
       message: "Your encrypted data here",
     })
   );
   ```

All requested features are implemented and tested!
