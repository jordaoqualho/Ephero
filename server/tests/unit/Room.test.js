const Room = require("../../src/models/Room");

describe("Room Model", () => {
  let room;

  beforeEach(() => {
    room = new Room("TEST123");
  });

  describe("Constructor", () => {
    test("should create room with correct properties", () => {
      expect(room.id).toBe("TEST123");
      expect(room.clients).toBeInstanceOf(Set);
      expect(room.maxClients).toBe(10);
      expect(room.ttl).toBe(30 * 60 * 1000);
      expect(room.createdAt).toBeLessThanOrEqual(Date.now());
      expect(room.lastActivity).toBeLessThanOrEqual(Date.now());
    });
  });

  describe("addClient", () => {
    test("should add client successfully", () => {
      const client = { id: "client1", ws: { readyState: 1 } };
      const result = room.addClient(client);

      expect(result).toBe(true);
      expect(room.clients.has(client)).toBe(true);
      expect(room.getClientCount()).toBe(1);
    });

    test("should not add client when room is full", () => {
      // Add 10 clients to fill the room
      for (let i = 0; i < 10; i++) {
        const client = { id: `client${i}`, ws: { readyState: 1 } };
        room.addClient(client);
      }

      const extraClient = { id: "client11", ws: { readyState: 1 } };
      const result = room.addClient(extraClient);

      expect(result).toBe(false);
      expect(room.clients.has(extraClient)).toBe(false);
      expect(room.getClientCount()).toBe(10);
    });

    test("should update lastActivity when adding client", () => {
      const originalActivity = room.lastActivity;
      const client = { id: "client1", ws: { readyState: 1 } };

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        room.addClient(client);
        expect(room.lastActivity).toBeGreaterThan(originalActivity);
      }, 10);
    });
  });

  describe("removeClient", () => {
    test("should remove client successfully", () => {
      const client = { id: "client1", ws: { readyState: 1 } };
      room.addClient(client);

      const result = room.removeClient(client);

      expect(result).toBe(true); // Room is now empty
      expect(room.clients.has(client)).toBe(false);
      expect(room.getClientCount()).toBe(0);
    });

    test("should return false when room is not empty after removal", () => {
      const client1 = { id: "client1", ws: { readyState: 1 } };
      const client2 = { id: "client2", ws: { readyState: 1 } };

      room.addClient(client1);
      room.addClient(client2);

      const result = room.removeClient(client1);

      expect(result).toBe(false); // Room still has client2
      expect(room.getClientCount()).toBe(1);
    });

    test("should update lastActivity when removing client", () => {
      const client = { id: "client1", ws: { readyState: 1 } };
      room.addClient(client);

      const originalActivity = room.lastActivity;

      setTimeout(() => {
        room.removeClient(client);
        expect(room.lastActivity).toBeGreaterThan(originalActivity);
      }, 10);
    });
  });

  describe("isExpired", () => {
    test("should return false for new room", () => {
      expect(room.isExpired()).toBe(false);
    });

    test("should return true for expired room", () => {
      room.lastActivity = Date.now() - 31 * 60 * 1000; // 31 minutes ago
      expect(room.isExpired()).toBe(true);
    });
  });

  describe("getClientCount", () => {
    test("should return correct client count", () => {
      expect(room.getClientCount()).toBe(0);

      const client1 = { id: "client1", ws: { readyState: 1 } };
      const client2 = { id: "client2", ws: { readyState: 1 } };

      room.addClient(client1);
      expect(room.getClientCount()).toBe(1);

      room.addClient(client2);
      expect(room.getClientCount()).toBe(2);
    });
  });

  describe("broadcast", () => {
    test("should send message to all clients except excluded", () => {
      const client1 = { id: "client1", ws: { readyState: 1 }, send: jest.fn() };
      const client2 = { id: "client2", ws: { readyState: 1 }, send: jest.fn() };
      const client3 = { id: "client3", ws: { readyState: 1 }, send: jest.fn() };

      room.addClient(client1);
      room.addClient(client2);
      room.addClient(client3);

      const message = { type: "test", content: "hello" };
      room.broadcast(message, client2);

      expect(client1.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(client2.send).not.toHaveBeenCalled();
      expect(client3.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    test("should not send to disconnected clients", () => {
      const client1 = { id: "client1", ws: { readyState: 1 }, send: jest.fn() };
      const client2 = { id: "client2", ws: { readyState: 3 }, send: jest.fn() }; // CLOSED

      room.addClient(client1);
      room.addClient(client2);

      const message = { type: "test", content: "hello" };
      room.broadcast(message);

      expect(client1.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(client2.send).not.toHaveBeenCalled();
    });
  });
});
