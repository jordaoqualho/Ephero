import { Room } from "../models/Room";
import { IClient, IRoom, IRoomInfo, IRoomService } from "../types";
import { generateRoomId } from "../utils/roomIdGenerator";

export class RoomService implements IRoomService {
  public rooms: Map<string, IRoom>;
  private defaultTTL: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.rooms = new Map();
    this.defaultTTL = defaultTTL;
    this.cleanupInterval = null;
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredRooms();
    }, 30000);
  }

  createRoom(customTTL?: number): IRoom {
    const roomId = generateRoomId();
    const ttl = customTTL || this.defaultTTL;
    const room = new Room(roomId, ttl);
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): IRoom | undefined {
    const room = this.rooms.get(roomId);
    if (room && room.isExpired()) {
      this.removeRoom(roomId);
      return undefined;
    }
    return room;
  }

  removeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.destroy();
      this.rooms.delete(roomId);
    }
  }

  addClientToRoom(roomId: string, client: IClient): { success: boolean; room?: IRoom; error?: string } {
    const room = this.getRoom(roomId);
    if (!room) {
      return { success: false, error: "Room not found or expired" };
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
    return Array.from(this.rooms.entries())
      .filter(([, room]) => !room.isExpired())
      .map(([roomId, room]) => {
        return {
          id: roomId,
          clientsCount: room.getClientCount(),
          createdAt: room.createdAt,
          timeUntilExpiration: room.getTimeUntilExpiration(),
        };
      });
  }

  cleanupExpiredRooms(): void {
    const expiredRooms: string[] = [];

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.isExpired()) {
        expiredRooms.push(roomId);
      }
    }

    expiredRooms.forEach((roomId) => {
      this.removeRoom(roomId);
    });

    if (expiredRooms.length > 0) {
      console.log(`🧹 Cleaned up ${expiredRooms.length} expired rooms`);
    }
  }

  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }

  getDefaultTTL(): number {
    return this.defaultTTL;
  }

  getRoomStats(): { totalRooms: number; activeRooms: number; expiredRooms: number } {
    const totalRooms = this.rooms.size;
    const activeRooms = Array.from(this.rooms.values()).filter((room) => !room.isExpired()).length;
    const expiredRooms = totalRooms - activeRooms;

    return {
      totalRooms,
      activeRooms,
      expiredRooms,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    for (const [, room] of this.rooms.entries()) {
      room.destroy();
    }
    this.rooms.clear();
  }
}
