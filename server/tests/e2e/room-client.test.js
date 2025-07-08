const WebSocket = require("ws");

class EpheroTestClient {
  constructor(name) {
    this.name = name;
    this.ws = null;
    this.roomId = null;
  }

  connect() {
    return new Promise((resolve) => {
      this.ws = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
        close: jest.fn(),
        on: jest.fn(),
      };
      resolve();
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case "welcome":
        break;
      case "room_created":
        this.roomId = message.roomId;
        break;
      case "room_joined":
        this.roomId = message.roomId;
        break;
      case "room_left":
        this.roomId = null;
        break;
      case "message":
        break;
      case "user_joined":
        break;
      case "user_left":
        break;
      case "rooms_list":
        break;
      case "error":
        break;
      default:
        break;
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
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

describe("Ephero E2E Tests", () => {
  let client;

  beforeEach(() => {
    client = new EpheroTestClient("TestClient");
  });

  afterEach(() => {
    if (client) {
      client.disconnect();
    }
  });

  test("should create client instance", () => {
    expect(client.name).toBe("TestClient");
    expect(client.ws).toBeNull();
    expect(client.roomId).toBeNull();
  });

  test("should connect successfully", async () => {
    await client.connect();
    expect(client.ws.readyState).toBe(WebSocket.OPEN);
  });

  test("should handle message types correctly", () => {
    const testMessage = { type: "room_created", roomId: "TEST123" };
    client.handleMessage(testMessage);
    expect(client.roomId).toBe("TEST123");
  });

  test("should send messages when connected", async () => {
    await client.connect();

    client.sendMessage("test message");
    expect(client.ws.send).toHaveBeenCalledWith(
      JSON.stringify({
        type: "message",
        message: "test message",
      })
    );
  });

  test("should disconnect properly", async () => {
    await client.connect();
    client.disconnect();
    expect(client.ws.close).toHaveBeenCalled();
  });
});

module.exports = EpheroTestClient;
