const Room = require("../models/Room");
const { generateRoomId } = require("../utils/roomIdGenerator");

class RoomService {
  constructor() {
    this.rooms = new Map();
  }

  createRoom() {
    const roomId = generateRoomId();
    const room = new Room(roomId);

    this.rooms.set(roomId, room);

    setTimeout(() => {
      if (this.rooms.has(roomId)) {
        this.rooms.delete(roomId);
      }
    }, room.ttl);

    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  removeRoom(roomId) {
    this.rooms.delete(roomId);
  }

  addClientToRoom(roomId, client) {
    const room = this.getRoom(roomId);
    if (!room) {
      return { success: false, error: "Room not found" };
    }

    const added = room.addClient(client);
    if (!added) {
      return { success: false, error: "Room is full" };
    }

    return { success: true, room };
  }

  removeClientFromRoom(client) {
    const room = this.getRoom(client.roomId);
    if (!room) return;

    const isEmpty = room.removeClient(client);
    if (isEmpty) {
      this.removeRoom(client.roomId);
    }

    return room;
  }

  getActiveRooms() {
    return Array.from(this.rooms.keys()).map((roomId) => {
      const room = this.rooms.get(roomId);
      return {
        id: roomId,
        clientsCount: room.getClientCount(),
        createdAt: room.createdAt,
      };
    });
  }

  cleanupExpiredRooms() {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.isExpired()) {
        this.rooms.delete(roomId);
      }
    }
  }
}

module.exports = RoomService;
