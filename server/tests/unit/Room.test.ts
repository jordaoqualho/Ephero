import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { WebSocket } from "ws";
import { Client } from "../../src/models/Client";
import { Room } from "../../src/models/Room";

describe("Room", () => {
  let room: Room;
  let client: Client;
  let mockWs: WebSocket;

  beforeEach(() => {
    mockWs = {
      readyState: 1,
      send: jest.fn(),
    } as unknown as WebSocket;
    room = new Room("test-room");
    client = new Client(mockWs);
  });

  describe("TTL functionality", () => {
    test("should create room with default TTL", () => {
      expect(room.ttl).toBe(30 * 60 * 1000);
    });

    test("should create room with custom TTL", () => {
      const customTTL = 5 * 60 * 1000;
      const customRoom = new Room("custom-room", customTTL);
      expect(customRoom.ttl).toBe(customTTL);
    });

    test("should not be expired initially", () => {
      expect(room.isExpired()).toBe(false);
    });

    test("should update activity when adding client", () => {
      const initialActivity = room.lastActivity;
      room.addClient(client);
      expect(room.lastActivity).toBeGreaterThanOrEqual(initialActivity);
    });

    test("should update activity when removing client", () => {
      room.addClient(client);
      const initialActivity = room.lastActivity;
      room.removeClient(client);
      expect(room.lastActivity).toBeGreaterThanOrEqual(initialActivity);
    });

    test("should update activity when broadcasting", () => {
      room.addClient(client);
      const initialActivity = room.lastActivity;
      room.broadcast({ type: "message", message: "test", userId: "test" });
      expect(room.lastActivity).toBeGreaterThanOrEqual(initialActivity);
    });
  });

  describe("Client management", () => {
    test("should add client successfully", () => {
      const result = room.addClient(client);
      expect(result).toBe(true);
      expect(room.getClientCount()).toBe(1);
      expect(client.roomId).toBe(room.id);
    });

    test("should not add client if room is full", () => {
      for (let i = 0; i < 10; i++) {
        const testClient = new Client(mockWs);
        room.addClient(testClient);
      }

      const newClient = new Client(mockWs);
      const result = room.addClient(newClient);
      expect(result).toBe(false);
      expect(room.getClientCount()).toBe(10);
    });

    test("should remove client successfully", () => {
      room.addClient(client);
      const isEmpty = room.removeClient(client);
      expect(isEmpty).toBe(true);
      expect(room.getClientCount()).toBe(0);
      expect(client.roomId).toBeNull();
    });

    test("should not be empty when removing client from room with multiple clients", () => {
      const client2 = new Client(mockWs);
      room.addClient(client);
      room.addClient(client2);

      const isEmpty = room.removeClient(client);
      expect(isEmpty).toBe(false);
      expect(room.getClientCount()).toBe(1);
    });
  });

  describe("Room destruction", () => {
    test("should destroy room and notify clients", () => {
      room.addClient(client);
      room.destroy();

      expect(room.getClientCount()).toBe(0);
      expect(client.roomId).toBeNull();
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: "error",
          error: "Room has expired due to inactivity",
        })
      );
    });
  });
});
