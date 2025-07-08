const Client = require("../../src/models/Client");

describe("Client", () => {
  let mockWs;
  let client;

  beforeEach(() => {
    mockWs = {
      readyState: 1,
      send: jest.fn(),
      close: jest.fn(),
    };
    client = new Client(mockWs);
  });

  describe("constructor", () => {
    test("should create client with correct properties", () => {
      expect(client.id).toBeDefined();
      expect(typeof client.id).toBe("string");
      expect(client.id.length).toBe(16);
      expect(client.ws).toBe(mockWs);
      expect(client.roomId).toBeNull();
      expect(client.joinedAt).toBeNull();
    });

    test("should generate different IDs for different clients", () => {
      const client1 = new Client(mockWs);
      const client2 = new Client(mockWs);
      expect(client1.id).not.toBe(client2.id);
    });
  });

  describe("send", () => {
    test("should send message when websocket is open", () => {
      const message = { type: "test", content: "hello" };
      client.send(message);

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    test("should not send message when websocket is closed", () => {
      mockWs.readyState = 3;
      const message = { type: "test", content: "hello" };
      client.send(message);

      expect(mockWs.send).not.toHaveBeenCalled();
    });

    test("should not send message when websocket is connecting", () => {
      mockWs.readyState = 0;
      const message = { type: "test", content: "hello" };
      client.send(message);

      expect(mockWs.send).not.toHaveBeenCalled();
    });

    test("should not send message when websocket is closing", () => {
      mockWs.readyState = 2;
      const message = { type: "test", content: "hello" };
      client.send(message);

      expect(mockWs.send).not.toHaveBeenCalled();
    });
  });

  describe("assignToRoom", () => {
    test("should assign client to room", () => {
      const roomId = "room123";
      client.assignToRoom(roomId);

      expect(client.roomId).toBe(roomId);
      expect(client.joinedAt).toBeGreaterThan(0);
    });

    test("should update joinedAt timestamp", () => {
      const originalJoinedAt = client.joinedAt;
      const roomId = "room123";

      setTimeout(() => {
        client.assignToRoom(roomId);
        expect(client.joinedAt).toBeGreaterThan(originalJoinedAt || 0);
      }, 10);
    });
  });

  describe("leaveRoom", () => {
    test("should remove client from room", () => {
      const roomId = "room123";
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
      client.assignToRoom("room123");
      expect(client.isInRoom()).toBe(true);
    });

    test("should return false when client is not in room", () => {
      expect(client.isInRoom()).toBe(false);
    });

    test("should return false after leaving room", () => {
      client.assignToRoom("room123");
      client.leaveRoom();
      expect(client.isInRoom()).toBe(false);
    });
  });

  describe("getInfo", () => {
    test("should return client information", () => {
      const roomId = "room123";
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
