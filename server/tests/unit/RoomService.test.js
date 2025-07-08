const RoomService = require("../../src/services/RoomService");
const Room = require("../../src/models/Room");

// Mock the roomIdGenerator
jest.mock("../../src/utils/roomIdGenerator", () => ({
  generateRoomId: jest.fn(),
}));

const { generateRoomId } = require("../../src/utils/roomIdGenerator");

describe("RoomService", () => {
  let roomService;

  beforeEach(() => {
    roomService = new RoomService();
    jest.clearAllMocks();
  });

  describe("createRoom", () => {
    test("should create a new room with generated ID", () => {
      const mockRoomId = "ABC12345";
      generateRoomId.mockReturnValue(mockRoomId);

      const room = roomService.createRoom();

      expect(generateRoomId).toHaveBeenCalled();
      expect(room).toBeInstanceOf(Room);
      expect(room.id).toBe(mockRoomId);
      expect(roomService.getRoom(mockRoomId)).toBe(room);
    });

    test("should schedule room cleanup after TTL", () => {
      jest.useFakeTimers();
      const mockRoomId = "ABC12345";
      generateRoomId.mockReturnValue(mockRoomId);

      const room = roomService.createRoom();
      expect(roomService.getRoom(mockRoomId)).toBe(room);

      // Fast-forward time to after TTL
      jest.advanceTimersByTime(31 * 60 * 1000); // 31 minutes

      expect(roomService.getRoom(mockRoomId)).toBeUndefined();
      jest.useRealTimers();
    });
  });

  describe("getRoom", () => {
    test("should return room if exists", () => {
      const mockRoomId = "ABC12345";
      generateRoomId.mockReturnValue(mockRoomId);

      const createdRoom = roomService.createRoom();
      const retrievedRoom = roomService.getRoom(mockRoomId);

      expect(retrievedRoom).toBe(createdRoom);
    });

    test("should return undefined if room does not exist", () => {
      const room = roomService.getRoom("NONEXISTENT");
      expect(room).toBeUndefined();
    });
  });

  describe("removeRoom", () => {
    test("should remove room from service", () => {
      const mockRoomId = "ABC12345";
      generateRoomId.mockReturnValue(mockRoomId);

      roomService.createRoom();
      expect(roomService.getRoom(mockRoomId)).toBeDefined();

      roomService.removeRoom(mockRoomId);
      expect(roomService.getRoom(mockRoomId)).toBeUndefined();
    });
  });

  describe("addClientToRoom", () => {
    test("should add client to existing room", () => {
      const mockRoomId = "ABC12345";
      generateRoomId.mockReturnValue(mockRoomId);

      const room = roomService.createRoom();
      const client = { id: "client1", ws: { readyState: 1 } };

      const result = roomService.addClientToRoom(mockRoomId, client);

      expect(result.success).toBe(true);
      expect(result.room).toBe(room);
      expect(room.getClientCount()).toBe(1);
    });

    test("should return error when room does not exist", () => {
      const client = { id: "client1", ws: { readyState: 1 } };

      const result = roomService.addClientToRoom("NONEXISTENT", client);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Room not found");
    });

    test("should return error when room is full", () => {
      const mockRoomId = "ABC12345";
      generateRoomId.mockReturnValue(mockRoomId);

      roomService.createRoom();

      // Add 10 clients to fill the room
      for (let i = 0; i < 10; i++) {
        const client = { id: `client${i}`, ws: { readyState: 1 } };
        roomService.addClientToRoom(mockRoomId, client);
      }

      const extraClient = { id: "client11", ws: { readyState: 1 } };
      const result = roomService.addClientToRoom(mockRoomId, extraClient);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Room is full");
    });
  });

  describe("removeClientFromRoom", () => {
    test("should remove client from room", () => {
      const mockRoomId = "ABC12345";
      generateRoomId.mockReturnValue(mockRoomId);

      const room = roomService.createRoom();
      const client = { id: "client1", ws: { readyState: 1 } };

      roomService.addClientToRoom(mockRoomId, client);
      expect(room.getClientCount()).toBe(1);

      const result = roomService.removeClientFromRoom(client);

      expect(result).toBe(room);
      expect(room.getClientCount()).toBe(0);
    });

    test("should remove room when it becomes empty", () => {
      const mockRoomId = "ABC12345";
      generateRoomId.mockReturnValue(mockRoomId);

      const room = roomService.createRoom();
      const client = { id: "client1", ws: { readyState: 1 } };

      roomService.addClientToRoom(mockRoomId, client);
      roomService.removeClientFromRoom(client);

      expect(roomService.getRoom(mockRoomId)).toBeUndefined();
    });

    test("should not remove room when other clients remain", () => {
      const mockRoomId = "ABC12345";
      generateRoomId.mockReturnValue(mockRoomId);

      const room = roomService.createRoom();
      const client1 = { id: "client1", ws: { readyState: 1 } };
      const client2 = { id: "client2", ws: { readyState: 1 } };

      roomService.addClientToRoom(mockRoomId, client1);
      roomService.addClientToRoom(mockRoomId, client2);

      roomService.removeClientFromRoom(client1);

      expect(roomService.getRoom(mockRoomId)).toBe(room);
      expect(room.getClientCount()).toBe(1);
    });

    test("should return undefined when client is not in any room", () => {
      const client = { id: "client1", ws: { readyState: 1 } };

      const result = roomService.removeClientFromRoom(client);

      expect(result).toBeUndefined();
    });
  });

  describe("getActiveRooms", () => {
    test("should return list of active rooms", () => {
      const mockRoomId1 = "ABC12345";
      const mockRoomId2 = "DEF67890";

      generateRoomId.mockReturnValueOnce(mockRoomId1).mockReturnValueOnce(mockRoomId2);

      const room1 = roomService.createRoom();
      const room2 = roomService.createRoom();

      const activeRooms = roomService.getActiveRooms();

      expect(activeRooms).toHaveLength(2);
      expect(activeRooms).toEqual(
        expect.arrayContaining([
          {
            id: mockRoomId1,
            clientsCount: 0,
            createdAt: room1.createdAt,
          },
          {
            id: mockRoomId2,
            clientsCount: 0,
            createdAt: room2.createdAt,
          },
        ])
      );
    });

    test("should return empty array when no rooms exist", () => {
      const activeRooms = roomService.getActiveRooms();
      expect(activeRooms).toEqual([]);
    });
  });

  describe("cleanupExpiredRooms", () => {
    test("should remove expired rooms", () => {
      const mockRoomId = "ABC12345";
      generateRoomId.mockReturnValue(mockRoomId);

      const room = roomService.createRoom();
      room.lastActivity = Date.now() - 31 * 60 * 1000; // 31 minutes ago

      roomService.cleanupExpiredRooms();

      expect(roomService.getRoom(mockRoomId)).toBeUndefined();
    });

    test("should keep non-expired rooms", () => {
      const mockRoomId = "ABC12345";
      generateRoomId.mockReturnValue(mockRoomId);

      const room = roomService.createRoom();
      room.lastActivity = Date.now() - 29 * 60 * 1000; // 29 minutes ago

      roomService.cleanupExpiredRooms();

      expect(roomService.getRoom(mockRoomId)).toBe(room);
    });
  });
});
