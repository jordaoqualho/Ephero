import { randomBytes } from "crypto";
import { WebSocket } from "ws";
import { IClient, IClientInfo, MessageType } from "../types";

export class Client implements IClient {
  public id: string;
  public ws: WebSocket;
  public roomId: string | null;
  public joinedAt: number | null;

  constructor(ws: WebSocket) {
    this.id = randomBytes(8).toString("hex");
    this.ws = ws;
    this.roomId = null;
    this.joinedAt = null;
  }

  assignToRoom(roomId: string): void {
    this.roomId = roomId;
    this.joinedAt = Date.now();
  }

  leaveRoom(): string | null {
    const roomId = this.roomId;
    this.roomId = null;
    this.joinedAt = null;
    return roomId;
  }

  isInRoom(): boolean {
    return this.roomId !== null;
  }

  send(message: MessageType): void {
    if (this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(message));
    }
  }

  getInfo(): IClientInfo {
    return {
      id: this.id,
      roomId: this.roomId,
      joinedAt: this.joinedAt,
    };
  }
}
