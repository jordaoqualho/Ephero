import { IClient, IRoom } from "../types";

export class Room implements IRoom {
  public id: string;
  public clients: Set<IClient>;
  public createdAt: number;
  public lastActivity: number;
  public maxClients: number;
  public ttl: number;

  constructor(id: string) {
    this.id = id;
    this.clients = new Set();
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.maxClients = 10;
    this.ttl = 30 * 60 * 1000;
  }

  addClient(client: IClient): boolean {
    if (this.clients.size >= this.maxClients) {
      return false;
    }
    this.clients.add(client);
    client.roomId = this.id;
    this.lastActivity = Date.now();
    return true;
  }

  removeClient(client: IClient): boolean {
    this.clients.delete(client);
    client.roomId = null;
    this.lastActivity = Date.now();
    return this.clients.size === 0;
  }

  isExpired(): boolean {
    return Date.now() - this.lastActivity > this.ttl;
  }

  getClientCount(): number {
    return this.clients.size;
  }

  broadcast(message: any, excludeClient: IClient | null = null): void {
    this.clients.forEach((client) => {
      if (client !== excludeClient && client.ws.readyState === 1) {
        client.send(message);
      }
    });
  }
}
