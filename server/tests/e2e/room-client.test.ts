import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { WebSocket } from "ws";
import { EpheroServer } from "../../src/server";
import { IClient, IMessageData } from "../../src/types";

const mockWss = {
  on: jest.fn(),
  close: jest.fn((callback?: () => void) => {
    if (callback) callback();
  }),
};

jest.mock("ws", () => ({
  WebSocketServer: jest.fn(() => mockWss),
}));

describe("Room Client E2E Tests", () => {
  let server: EpheroServer;
  let mockWebSocket: WebSocket;

  beforeEach(() => {
    server = new EpheroServer(8082);
    mockWebSocket = {
      readyState: 1,
      send: jest.fn(),
      close: jest.fn(),
      on: jest.fn().mockReturnThis(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as unknown as WebSocket;
  });

  afterEach(() => {
    server.stop();
  });

  describe("Client Connection", () => {
    test("should handle client connection and send welcome message", () => {
      const client = server.clientService.createClient(mockWebSocket);
      expect(client.id).toBeDefined();
      expect(client.roomId).toBeNull();
    });

    test("should handle client disconnection", () => {
      const client = server.clientService.createClient(mockWebSocket);
      const initialClientCount = server.clientService.getAllClients().length;
      server.handleClientDisconnect(client);
      expect(server.clientService.getAllClients()).toHaveLength(initialClientCount - 1);
    });
  });

  describe("Room Operations", () => {
    test("should create room and add client", () => {
      const client = server.clientService.createClient(mockWebSocket);
      const room = server.roomService.createRoom();
      const result = server.roomService.addClientToRoom(room.id, client);
      expect(result.success).toBe(true);
      expect(client.roomId).toBe(room.id);
      expect(room.getClientCount()).toBe(1);
    });

    test("should handle multiple clients in same room", () => {
      const room = server.roomService.createRoom();
      const clients: IClient[] = [];
      for (let i = 0; i < 3; i++) {
        const mockWs = {
          readyState: 1,
          send: jest.fn(),
          on: jest.fn().mockReturnThis(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        } as unknown as WebSocket;
        const client = server.clientService.createClient(mockWs);
        const result = server.roomService.addClientToRoom(room.id, client);
        expect(result.success).toBe(true);
        clients.push(client);
      }
      expect(room.getClientCount()).toBe(3);
      expect(room.clients.size).toBe(3);
    });

    test("should remove client from room", () => {
      const client = server.clientService.createClient(mockWebSocket);
      const room = server.roomService.createRoom();
      server.roomService.addClientToRoom(room.id, client);
      expect(room.getClientCount()).toBe(1);
      server.roomService.removeClientFromRoom(client);
      expect(room.getClientCount()).toBe(0);
      expect(client.roomId).toBeNull();
    });
  });

  describe("Message Handling", () => {
    test("should handle create room message", () => {
      const client = server.clientService.createClient(mockWebSocket);
      server.messageHandler.handleCreateRoom(client);
      expect(client.roomId).toBeDefined();
      expect(client.isInRoom()).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining("room_created"));
    });

    test("should handle join room message", () => {
      const room = server.roomService.createRoom();
      const client = server.clientService.createClient(mockWebSocket);
      const messageData: IMessageData = { type: "join_room", roomId: room.id };
      server.messageHandler.handleJoinRoom(client, messageData);
      expect(client.roomId).toBe(room.id);
      expect(client.isInRoom()).toBe(true);
      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining("room_joined"));
    });

    test("should handle leave room message", () => {
      const room = server.roomService.createRoom();
      const client = server.clientService.createClient(mockWebSocket);
      server.roomService.addClientToRoom(room.id, client);
      server.messageHandler.handleLeaveRoom(client);
      expect(client.roomId).toBeNull();
      expect(client.isInRoom()).toBe(false);
      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining("room_left"));
    });

    test("should handle broadcast message", () => {
      const room = server.roomService.createRoom();
      const mockWs1 = {
        readyState: 1,
        send: jest.fn(),
        on: jest.fn().mockReturnThis(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as unknown as WebSocket;
      const mockWs2 = {
        readyState: 1,
        send: jest.fn(),
        on: jest.fn().mockReturnThis(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as unknown as WebSocket;
      const client1 = server.clientService.createClient(mockWs1);
      const client2 = server.clientService.createClient(mockWs2);
      server.roomService.addClientToRoom(room.id, client1);
      server.roomService.addClientToRoom(room.id, client2);
      const messageData: IMessageData = { type: "message", message: "Hello World" };
      server.messageHandler.handleBroadcastMessage(client1, messageData);
      expect(mockWs2.send).toHaveBeenCalledWith(expect.stringContaining("Hello World"));
      expect(mockWs1.send).not.toHaveBeenCalledWith(expect.stringContaining("Hello World"));
    });

    test("should handle get rooms message", () => {
      const client = server.clientService.createClient(mockWebSocket);
      server.roomService.createRoom();
      server.messageHandler.handleGetRooms(client);
      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining("rooms_list"));
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid room join", () => {
      const client = server.clientService.createClient(mockWebSocket);
      const messageData: IMessageData = { type: "join_room", roomId: "INVALID" };
      server.messageHandler.handleJoinRoom(client, messageData);
      expect(client.roomId).toBeNull();
      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining("error"));
    });

    test("should handle message without room", () => {
      const client = server.clientService.createClient(mockWebSocket);
      const messageData: IMessageData = { type: "message", message: "Hello" };
      server.messageHandler.handleBroadcastMessage(client, messageData);
      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining("error"));
    });

    test("should handle message without content", () => {
      const room = server.roomService.createRoom();
      const client = server.clientService.createClient(mockWebSocket);
      server.roomService.addClientToRoom(room.id, client);
      const messageData: IMessageData = { type: "message" };
      server.messageHandler.handleBroadcastMessage(client, messageData);
      expect(mockWebSocket.send).toHaveBeenCalledWith(expect.stringContaining("error"));
    });
  });

  describe("Room Expiration", () => {
    test("should cleanup expired rooms", () => {
      const room = server.roomService.createRoom();
      room.lastActivity = Date.now() - 6 * 60 * 1000;
      server.roomService.cleanupExpiredRooms();
      expect(server.roomService.getRoom(room.id)).toBeUndefined();
    });

    test("should keep active rooms", () => {
      const room = server.roomService.createRoom();
      room.lastActivity = Date.now() - 4 * 60 * 1000;
      server.roomService.cleanupExpiredRooms();
      expect(server.roomService.getRoom(room.id)).toBe(room);
    });
  });

  describe("Server Lifecycle", () => {
    test("should start and stop server", () => {
      expect(server.wss).toBeNull();
      server.start();
      expect(server.wss).toBeDefined();
      server.stop();
      expect(server.wss).toBeNull();
    });
  });
});
