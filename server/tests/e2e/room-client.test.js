const WebSocket = require("ws");

class EpheroTestClient {
  constructor(name) {
    this.name = name;
    this.ws = null;
    this.roomId = null;
  }

  connect() {
    this.ws = new WebSocket("ws://localhost:8080");

    this.ws.on("open", () => {
      console.log(`[${this.name}] Connected to server`);
    });

    this.ws.on("message", (data) => {
      const message = JSON.parse(data.toString());
      this.handleMessage(message);
    });

    this.ws.on("close", () => {
      console.log(`[${this.name}] Disconnected from server`);
    });

    this.ws.on("error", (error) => {
      console.error(`[${this.name}] Error:`, error);
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case "welcome":
        console.log(`[${this.name}] ${message.message}`);
        console.log(`[${this.name}] Client ID: ${message.clientId}`);
        break;

      case "room_created":
        this.roomId = message.roomId;
        console.log(`[${this.name}] ${message.message}`);
        break;

      case "room_joined":
        this.roomId = message.roomId;
        console.log(`[${this.name}] ${message.message} (${message.clientsCount} users in room)`);
        break;

      case "room_left":
        this.roomId = null;
        console.log(`[${this.name}] ${message.message}`);
        break;

      case "message":
        console.log(`[${this.name}] Message from ${message.userId}: ${message.message}`);
        break;

      case "user_joined":
        console.log(`[${this.name}] User ${message.userId} joined the room`);
        break;

      case "user_left":
        console.log(`[${this.name}] User ${message.userId} left the room`);
        break;

      case "rooms_list":
        console.log(`[${this.name}] Active rooms:`, message.rooms);
        break;

      case "error":
        console.error(`[${this.name}] Error: ${message.error}`);
        break;

      default:
        console.log(`[${this.name}] Unknown message:`, message);
    }
  }

  createRoom() {
    this.send({ type: "create_room" });
  }

  joinRoom(roomId) {
    this.send({ type: "join_room", roomId });
  }

  sendMessage(text) {
    this.send({ type: "message", message: text });
  }

  leaveRoom() {
    this.send({ type: "leave_room" });
  }

  getRooms() {
    this.send({ type: "get_rooms" });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error(`[${this.name}] WebSocket is not connected`);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Example usage
if (require.main === module) {
  console.log("=== Ephero Test Client ===");
  console.log("Available commands:");
  console.log("1. create - Create a new room");
  console.log("2. join <roomId> - Join an existing room");
  console.log("3. message <text> - Send a message");
  console.log("4. leave - Leave the room");
  console.log("5. rooms - List active rooms");
  console.log("6. quit - Exit the client");
  console.log("");

  const client = new EpheroTestClient("TestClient");
  client.connect();

  // Simple command line interface
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", (input) => {
    const parts = input.trim().split(" ");
    const command = parts[0];

    switch (command) {
      case "create":
        client.createRoom();
        break;

      case "join":
        if (parts[1]) {
          client.joinRoom(parts[1]);
        } else {
          console.log("Usage: join <roomId>");
        }
        break;

      case "message":
        if (parts[1]) {
          const message = parts.slice(1).join(" ");
          client.sendMessage(message);
        } else {
          console.log("Usage: message <text>");
        }
        break;

      case "leave":
        client.leaveRoom();
        break;

      case "rooms":
        client.getRooms();
        break;

      case "quit":
        client.disconnect();
        rl.close();
        process.exit(0);
        break;

      default:
        console.log("Unknown command. Use: create, join, message, leave, rooms, or quit");
    }
  });
}

module.exports = EpheroTestClient;
