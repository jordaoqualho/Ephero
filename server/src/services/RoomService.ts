import { Room } from "../models/Room";
import { IClient, IRoom, IRoomInfo, IRoomService } from "../types";
import { generateRoomId } from "../utils/roomIdGenerator";

export class RoomService implements IRoomService {
  public rooms: Map<string, IRoom>;

  constructor() {
    this.rooms = new Map();
  }

  createRoom(): IRoom {
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

  getRoom(roomId: string): IRoom | undefined {
    return this.rooms.get(roomId);
  }

  removeRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  addClientToRoom(roomId: string, client: IClient): { success: boolean; room?: IRoom; error?: string } {
    const room = this.getRoom(roomId);
    if (!room) {
      return { success: false, error: "Room not found" };
    }
    if (client.roomId) {
      return { success: false, error: "Client is already in a room" };
    }
    const added = room.addClient(client);
    if (!added) {
      return { success: false, error: "Room is full" };
    }
    client.roomId = roomId;
    return { success: true, room };
  }

  removeClientFromRoom(client: IClient): IRoom | undefined {
    if (!client.roomId) {
      return undefined;
    }
    const roomId = client.roomId;
    const room = this.getRoom(roomId);
    if (!room) {
      return undefined;
    }
    const isEmpty = room.removeClient(client);
    client.roomId = null;
    if (isEmpty) {
      this.removeRoom(roomId);
    }
    return room;
  }

  getActiveRooms(): IRoomInfo[] {
    return Array.from(this.rooms.keys()).map((roomId) => {
      const room = this.rooms.get(roomId)!;
      return {
        id: roomId,
        clientsCount: room.getClientCount(),
        createdAt: room.createdAt,
      };
    });
  }

  cleanupExpiredRooms(): void {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.isExpired()) {
        this.rooms.delete(roomId);
      }
    }
  }
}
