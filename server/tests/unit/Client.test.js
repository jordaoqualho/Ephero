const Client = require("../../src/models/Client");

// Mock WebSocket
const mockWebSocket = {
  readyState: 1, // OPEN
  send: jest.fn(),
};

describe("Client Model", () => {
  let client;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new Client(mockWebSocket);
  });

  describe("Constructor", () => {
    test("should create client with unique ID", () => {
      expect(client.id).toBeDefined();
      expect(typeof client.id).toBe("string");
      expect(client.id.length).toBe(16); // 8 bytes = 16 hex chars
    });

    test("should initialize with correct properties", () => {
      expect(client.ws).toBe(mockWebSocket);
      expect(client.roomId).toBeNull();
      expect(client.joinedAt).toBeNull();
    });

    test("should generate different IDs for different clients", () => {
      const client1 = new Client(mockWebSocket);
      const client2 = new Client(mockWebSocket);

      expect(client1.id).not.toBe(client2.id);
    });
  });

  describe("assignToRoom", () => {
    test("should assign client to room", () => {
      const roomId = "TEST123";

      client.assignToRoom(roomId);

      expect(client.roomId).toBe(roomId);
      expect(client.joinedAt).toBeLessThanOrEqual(Date.now());
      expect(client.joinedAt).toBeGreaterThan(Date.now() - 1000);
    });

    test("should update joinedAt timestamp", () => {
      const originalJoinedAt = client.joinedAt;
      const roomId = "TEST123";

      setTimeout(() => {
        client.assignToRoom(roomId);
        expect(client.joinedAt).toBeGreaterThan(originalJoinedAt || 0);
      }, 10);
    });
  });

  describe("leaveRoom", () => {
    test("should remove client from room", () => {
      const roomId = "TEST123";
      client.assignToRoom(roomId);

      const returnedRoomId = client.leaveRoom();

      expect(returnedRoomId).toBe(roomId);
      expect(client.roomId).toBeNull();
      expect(client.joinedAt).toBeNull();
    });

    test("should return null when client is not in room", () => {
      const returnedRoomId = client.leaveRoom();

      expect(returnedRoomId).toBeNull();
      expect(client.roomId).toBeNull();
      expect(client.joinedAt).toBeNull();
    });
  });

  describe("isInRoom", () => {
    test("should return true when client is in room", () => {
      client.assignToRoom("TEST123");
      expect(client.isInRoom()).toBe(true);
    });

    test("should return false when client is not in room", () => {
      expect(client.isInRoom()).toBe(false);
    });

    test("should return false after leaving room", () => {
      client.assignToRoom("TEST123");
      client.leaveRoom();
      expect(client.isInRoom()).toBe(false);
    });
  });

  describe("send", () => {
    test("should send message when WebSocket is open", () => {
      const message = { type: "test", content: "hello" };

      client.send(message);

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    test("should not send message when WebSocket is closed", () => {
      mockWebSocket.readyState = 3; // CLOSED
      const message = { type: "test", content: "hello" };

      client.send(message);

      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    test("should not send message when WebSocket is connecting", () => {
      mockWebSocket.readyState = 0; // CONNECTING
      const message = { type: "test", content: "hello" };

      client.send(message);

      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });

    test("should not send message when WebSocket is closing", () => {
      mockWebSocket.readyState = 2; // CLOSING
      const message = { type: "test", content: "hello" };

      client.send(message);

      expect(mockWebSocket.send).not.toHaveBeenCalled();
    });
  });

  describe("getInfo", () => {
    test("should return client information", () => {
      const roomId = "TEST123";
      client.assignToRoom(roomId);

      const info = client.getInfo();

      expect(info).toEqual({
        id: client.id,
        roomId: roomId,
        joinedAt: client.joinedAt,
      });
    });

    test("should return null values when not in room", () => {
      const info = client.getInfo();

      expect(info).toEqual({
        id: client.id,
        roomId: null,
        joinedAt: null,
      });
    });
  });
});
