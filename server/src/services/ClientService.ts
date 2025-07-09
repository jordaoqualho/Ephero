import { WebSocket } from "ws";
import { Client } from "../models/Client";
import { IClient, IClientService } from "../types";

export class ClientService implements IClientService {
  public clients: Map<string, IClient>;

  constructor() {
    this.clients = new Map();
  }

  createClient(ws: WebSocket): IClient {
    const client = new Client(ws);
    this.clients.set(client.id, client);
    return client;
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  getClient(clientId: string): IClient | undefined {
    return this.clients.get(clientId);
  }

  getAllClients(): IClient[] {
    return Array.from(this.clients.values());
  }

  sendWelcomeMessage(client: IClient): void {
    client.send({
      type: "welcome",
      message: "Welcome to Ephero! You are now connected.",
      clientId: client.id,
    });
  }
}
