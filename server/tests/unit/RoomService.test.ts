import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { WebSocket } from "ws";
import { RoomService } from "../../src/services/RoomService";
import { IRoomService } from "../../src/types";

describe("RoomService", () => {
  let roomService: IRoomService;

  beforeEach(() => {
    roomService = new RoomService();
  });

  afterEach(() => {
    // Clean up
  });

  describe("createRoom", () => {
    test("should create a new room with unique ID", () => {
      const room = roomService.createRoom();

      expect(room).toBeDefined();
      expect(room.id).toBeDefined();
      expect(room.getClientCount()).toBe(0);
      expect(room.lastActivity).toBeDefined();
    });

    test("should create rooms with different IDs", () => {
      const room1 = roomService.createRoom();
      const room2 = roomService.createRoom();

      expect(room1.id).not.toBe(room2.id);
    });
  });

  describe("getRoom", () => {
    test("should return room by ID", () => {
      const createdRoom = roomService.createRoom();
      const retrievedRoom = roomService.getRoom(createdRoom.id);

      expect(retrievedRoom).toBe(createdRoom);
    });

    test("should return undefined for non-existent room", () => {
      const room = roomService.getRoom("NON_EXISTENT");

      expect(room).toBeUndefined();
    });
  });

  describe("addClientToRoom", () => {
    test("should add client to room successfully", () => {
      const room = roomService.createRoom();
      const mockWs = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const client = {
        id: "test-client",
        ws: mockWs,
        roomId: null,
        send: jest.fn(),
        isInRoom: jest.fn(() => false),
        assignToRoom: jest.fn(),
        leaveRoom: jest.fn(),
      } as any;

      const result = roomService.addClientToRoom(room.id, client);

      expect(result.success).toBe(true);
      expect(result.room).toBe(room);
      expect(client.roomId).toBe(room.id);
      expect(room.getClientCount()).toBe(1);
    });

    test("should fail when room does not exist", () => {
      const mockWs = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const client = {
        id: "test-client",
        ws: mockWs,
        roomId: null,
        send: jest.fn(),
        isInRoom: jest.fn(() => false),
        assignToRoom: jest.fn(),
        leaveRoom: jest.fn(),
      } as any;

      const result = roomService.addClientToRoom("NON_EXISTENT", client);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Room not found");
      expect(client.roomId).toBeNull();
    });

    test("should fail when client is already in a room", () => {
      const room1 = roomService.createRoom();
      const room2 = roomService.createRoom();
      const mockWs = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const client = {
        id: "test-client",
        ws: mockWs,
        roomId: room1.id,
        send: jest.fn(),
        isInRoom: jest.fn(() => true),
        assignToRoom: jest.fn(),
        leaveRoom: jest.fn(),
      } as any;

      const result = roomService.addClientToRoom(room2.id, client);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Client is already in a room");
      expect(client.roomId).toBe(room1.id);
    });
  });

  describe("removeClientFromRoom", () => {
    test("should remove client from room", () => {
      const room = roomService.createRoom();
      const mockWs = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const client = {
        id: "test-client",
        ws: mockWs,
        roomId: room.id,
        send: jest.fn(),
        isInRoom: jest.fn(() => true),
        assignToRoom: jest.fn(),
        leaveRoom: jest.fn(),
      } as any;

      // Add client to room first
      room.addClient(client);
      expect(room.getClientCount()).toBe(1);

      roomService.removeClientFromRoom(client);

      expect(client.roomId).toBeNull();
      expect(room.getClientCount()).toBe(0);
    });

    test("should remove room when last client leaves", () => {
      const room = roomService.createRoom();
      const mockWs = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const client = {
        id: "test-client",
        ws: mockWs,
        roomId: room.id,
        send: jest.fn(),
        isInRoom: jest.fn(() => true),
        assignToRoom: jest.fn(),
        leaveRoom: jest.fn(),
      } as any;

      // Add client to room first
      room.addClient(client);
      roomService.removeClientFromRoom(client);

      expect(roomService.getRoom(room.id)).toBeUndefined();
    });

    test("should handle client not in room", () => {
      const mockWs = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const client = {
        id: "test-client",
        ws: mockWs,
        roomId: null,
        send: jest.fn(),
        isInRoom: jest.fn(() => false),
        assignToRoom: jest.fn(),
        leaveRoom: jest.fn(),
      } as any;

      // Should not throw error
      expect(() => roomService.removeClientFromRoom(client)).not.toThrow();
    });
  });

  describe("getActiveRooms", () => {
    test("should return all active rooms", () => {
      const room1 = roomService.createRoom();
      const room2 = roomService.createRoom();

      const activeRooms = roomService.getActiveRooms();

      expect(activeRooms).toHaveLength(2);
      expect(activeRooms.some((r) => r.id === room1.id)).toBe(true);
      expect(activeRooms.some((r) => r.id === room2.id)).toBe(true);
    });

    test("should return empty array when no rooms exist", () => {
      const activeRooms = roomService.getActiveRooms();

      expect(activeRooms).toHaveLength(0);
    });
  });

  describe("cleanupExpiredRooms", () => {
    test("should remove expired rooms", () => {
      const room = roomService.createRoom();
      room.lastActivity = Date.now() - 31 * 60 * 1000; // Expired

      roomService.cleanupExpiredRooms();

      expect(roomService.getRoom(room.id)).toBeUndefined();
    });

    test("should keep active rooms", () => {
      const room = roomService.createRoom();
      room.lastActivity = Date.now() - 29 * 60 * 1000; // Not expired

      roomService.cleanupExpiredRooms();

      expect(roomService.getRoom(room.id)).toBe(room);
    });

    test("should handle multiple rooms with mixed expiration", () => {
      const activeRoom = roomService.createRoom();
      const expiredRoom = roomService.createRoom();

      activeRoom.lastActivity = Date.now() - 29 * 60 * 1000; // Not expired
      expiredRoom.lastActivity = Date.now() - 31 * 60 * 1000; // Expired

      roomService.cleanupExpiredRooms();

      expect(roomService.getRoom(activeRoom.id)).toBe(activeRoom);
      expect(roomService.getRoom(expiredRoom.id)).toBeUndefined();
    });
  });
});
