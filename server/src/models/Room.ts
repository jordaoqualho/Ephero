import { IClient, IRoom, MessageType } from "../types";

export class Room implements IRoom {
  public id: string;
  public clients: Set<IClient>;
  public createdAt: number;
  public lastActivity: number;
  public maxClients: number;
  public ttl: number;
  public data?: string;
  private activityTimeout: ReturnType<typeof setTimeout> | null;

  constructor(id: string, ttl: number = 5 * 60 * 1000) {
    this.id = id;
    this.clients = new Set();
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.maxClients = 10;
    this.ttl = ttl;
    this.activityTimeout = null;
    this.scheduleExpiration();
  }

  addClient(client: IClient): boolean {
    if (this.clients.size >= this.maxClients) {
      return false;
    }
    this.clients.add(client);
    client.roomId = this.id;
    this.updateActivity();
    return true;
  }

  removeClient(client: IClient): boolean {
    this.clients.delete(client);
    client.roomId = null;
    this.updateActivity();
    return this.clients.size === 0;
  }

  updateActivity(): void {
    this.lastActivity = Date.now();
    this.scheduleExpiration();
  }

  private scheduleExpiration(): void {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }

    this.activityTimeout = setTimeout(() => {
      this.markForExpiration();
    }, this.ttl);
  }

  private markForExpiration(): void {
    this.lastActivity = 0;
  }

  isExpired(): boolean {
    return this.lastActivity === 0 || Date.now() - this.lastActivity > this.ttl;
  }

  getClientCount(): number {
    return this.clients.size;
  }

  broadcast(message: MessageType, excludeClient: IClient | null = null): void {
    this.clients.forEach((client) => {
      if (client !== excludeClient && client.ws.readyState === 1) {
        client.send(message);
      }
    });
    this.updateActivity();
  }

  destroy(): void {
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }
    this.clients.forEach((client) => {
      if (client.ws.readyState === 1) {
        client.send({
          type: "error",
          error: "Room has expired due to inactivity",
        });
      }
      client.roomId = null;
    });
    this.clients.clear();
  }

  getTimeUntilExpiration(): number {
    if (this.isExpired()) {
      return 0;
    }
    return Math.max(0, this.ttl - (Date.now() - this.lastActivity));
  }

  setData(data: string): void {
    this.data = data;
    this.updateActivity();
  }

  getData(): string | undefined {
    return this.data;
  }
}
