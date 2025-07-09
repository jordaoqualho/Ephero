import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Client } from "../../src/models/Client";
import { IClient } from "../../src/types";
import { WebSocket } from "ws";

describe("Client", () => {
  let mockWs: WebSocket;
  let client: IClient;

  beforeEach(() => {
    mockWs = {
      readyState: 1,
      send: jest.fn(),
      close: jest.fn(),
    } as unknown as WebSocket;
    client = new Client(mockWs);
  });

  describe("constructor", () => {
    test("should create client with unique ID", () => {
      expect(client.id).toBeDefined();
      expect(client.id).toHaveLength(18);
      expect(client.roomId).toBeNull();
      expect(client.ws).toBe(mockWs);
    });

    test("should generate different IDs for different clients", () => {
      const client1 = new Client(mockWs);
      const client2 = new Client(mockWs);

      expect(client1.id).toBeDefined();
      expect(client2.id).toBeDefined();
      expect(typeof client1.id).toBe("string");
      expect(typeof client2.id).toBe("string");
    });
  });

  describe("isInRoom", () => {
    test("should return false when not in room", () => {
      expect(client.isInRoom()).toBe(false);
    });

    test("should return true when in room", () => {
      client.roomId = "TEST_ROOM";
      expect(client.isInRoom()).toBe(true);
    });
  });

  describe("send", () => {
    test("should send message through websocket", () => {
      const message = { type: "test", data: "hello" };
      client.send(message);

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    test("should handle multiple messages", () => {
      const message1 = { type: "test1", data: "hello1" };
      const message2 = { type: "test2", data: "hello2" };

      client.send(message1);
      client.send(message2);

      expect(mockWs.send).toHaveBeenCalledTimes(2);
      expect(mockWs.send).toHaveBeenNthCalledWith(1, JSON.stringify(message1));
      expect(mockWs.send).toHaveBeenNthCalledWith(2, JSON.stringify(message2));
    });
  });

  describe("assignToRoom", () => {
    test("should assign client to room successfully", () => {
      const roomId = "TEST_ROOM";
      client.assignToRoom(roomId);

      expect(client.roomId).toBe(roomId);
    });

    test("should change room when already in one", () => {
      client.roomId = "OLD_ROOM";
      const newRoomId = "NEW_ROOM";
      client.assignToRoom(newRoomId);

      expect(client.roomId).toBe(newRoomId);
    });
  });

  describe("leaveRoom", () => {
    test("should leave room successfully", () => {
      client.roomId = "TEST_ROOM";
      client.leaveRoom();

      expect(client.roomId).toBeNull();
    });

    test("should handle leaving when not in room", () => {
      client.roomId = null;
      expect(() => client.leaveRoom()).not.toThrow();
      expect(client.roomId).toBeNull();
    });
  });
});
