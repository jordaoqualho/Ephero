import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { WebSocket } from "ws";
import { EpheroServer } from "../../src/server";
import { ClientService } from "../../src/services/ClientService";
import { MessageHandler } from "../../src/services/MessageHandler";
import { RoomService } from "../../src/services/RoomService";
import { IClient, IMessageData } from "../../src/types";

describe("Room Functionality Integration Tests", () => {
  let server: EpheroServer;
  let roomService: RoomService;
  let clientService: ClientService;
  let messageHandler: MessageHandler;

  beforeEach(() => {
    server = new EpheroServer(8081);
    roomService = server.roomService;
    clientService = server.clientService;
    messageHandler = server.messageHandler;
  });

  afterEach(() => {
    server.stop();
  });

  describe("Room Creation and Management", () => {
    test("should create room and add client", () => {
      const mockWs = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const client = clientService.createClient(mockWs);

      const room = roomService.createRoom();
      const result = roomService.addClientToRoom(room.id, client);

      expect(result.success).toBe(true);
      expect(result.room).toBe(room);
      expect(room.getClientCount()).toBe(1);
      expect(client.roomId).toBe(room.id);
    });

    test("should handle multiple clients in room", () => {
      const room = roomService.createRoom();
      const clients: IClient[] = [];

      for (let i = 0; i < 3; i++) {
        const mockWs = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
        const client = clientService.createClient(mockWs);
        const result = roomService.addClientToRoom(room.id, client);
        expect(result.success).toBe(true);
        clients.push(client);
      }

      expect(room.getClientCount()).toBe(3);
      expect(roomService.getActiveRooms()).toHaveLength(1);
    });

    test("should remove room when last client leaves", () => {
      const room = roomService.createRoom();
      const mockWs = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const client = clientService.createClient(mockWs);

      roomService.addClientToRoom(room.id, client);
      expect(room.getClientCount()).toBe(1);

      roomService.removeClientFromRoom(client);
      expect(roomService.getRoom(room.id)).toBeUndefined();
    });
  });

  describe("Message Handling", () => {
    test("should handle create room message", () => {
      const mockWs = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const client = clientService.createClient(mockWs);

      messageHandler.handleCreateRoom(client);

      expect(client.roomId).toBeDefined();
      expect(client.isInRoom()).toBe(true);
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining("room_created"));
    });

    test("should handle join room message", () => {
      const room = roomService.createRoom();
      const mockWs = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const client = clientService.createClient(mockWs);

      const messageData: IMessageData = { type: "join_room", roomId: room.id };
      messageHandler.handleJoinRoom(client, messageData);

      expect(client.roomId).toBe(room.id);
      expect(client.isInRoom()).toBe(true);
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining("room_joined"));
    });

    test("should handle leave room message", () => {
      const room = roomService.createRoom();
      const mockWs = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const client = clientService.createClient(mockWs);

      roomService.addClientToRoom(room.id, client);
      messageHandler.handleLeaveRoom(client);

      expect(client.roomId).toBeNull();
      expect(client.isInRoom()).toBe(false);
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining("room_left"));
    });

    test("should handle broadcast message", () => {
      const room = roomService.createRoom();
      const mockWs1 = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const mockWs2 = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const client1 = clientService.createClient(mockWs1);
      const client2 = clientService.createClient(mockWs2);

      roomService.addClientToRoom(room.id, client1);
      roomService.addClientToRoom(room.id, client2);

      const messageData: IMessageData = { type: "message", message: "Hello World" };
      messageHandler.handleBroadcastMessage(client1, messageData);

      expect(mockWs2.send).toHaveBeenCalledWith(expect.stringContaining("Hello World"));
      expect(mockWs1.send).not.toHaveBeenCalledWith(expect.stringContaining("Hello World"));
    });
  });

  describe("Room Expiration", () => {
    test("should cleanup expired rooms", () => {
      const room = roomService.createRoom();
      room.lastActivity = Date.now() - 31 * 60 * 1000; // Expired

      roomService.cleanupExpiredRooms();

      expect(roomService.getRoom(room.id)).toBeUndefined();
    });

    test("should keep active rooms", () => {
      const room = roomService.createRoom();
      room.lastActivity = Date.now() - 4 * 60 * 1000;

      roomService.cleanupExpiredRooms();

      expect(roomService.getRoom(room.id)).toBe(room);
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid room join", () => {
      const mockWs = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const client = clientService.createClient(mockWs);

      const messageData: IMessageData = { type: "join_room", roomId: "INVALID" };
      messageHandler.handleJoinRoom(client, messageData);

      expect(client.roomId).toBeNull();
      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining("error"));
    });

    test("should handle message without room", () => {
      const mockWs = { readyState: 1, send: jest.fn() } as unknown as WebSocket;
      const client = clientService.createClient(mockWs);

      const messageData: IMessageData = { type: "message", message: "Hello" };
      messageHandler.handleBroadcastMessage(client, messageData);

      expect(mockWs.send).toHaveBeenCalledWith(expect.stringContaining("error"));
    });
  });
});
