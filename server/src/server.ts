import { WebSocket, Server as WebSocketServer } from "ws";
import { ClientService } from "./services/ClientService";
import { MessageHandler } from "./services/MessageHandler";
import { RoomService } from "./services/RoomService";
import { IClient, IEpheroServer } from "./types";

export class EpheroServer implements IEpheroServer {
  public port: number;
  public wss: WebSocketServer | null;
  public roomService: RoomService;
  public clientService: ClientService;
  public messageHandler: MessageHandler;

  constructor(port: number = 8080) {
    this.port = port;
    this.wss = null;
    this.roomService = new RoomService();
    this.clientService = new ClientService();
    this.messageHandler = new MessageHandler(this.roomService, this.clientService);
  }

  start(): void {
    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on("connection", (ws: WebSocket) => {
      const client = this.clientService.createClient(ws);

      this.clientService.sendWelcomeMessage(client);

      this.setupClientHandlers(client);
    });

    setInterval(() => {
      this.roomService.cleanupExpiredRooms();
    }, 60000);

    console.log(`WebSocket server running at ws://localhost:${this.port}`);
  }

  setupClientHandlers(client: IClient): void {
    client.ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.messageHandler.handleMessage(client, message);
      } catch (error) {
        client.send({
          type: "error",
          error: "Invalid JSON message",
        });
      }
    });

    client.ws.on("close", () => {
      this.handleClientDisconnect(client);
    });

    client.ws.on("error", (error: Error) => {
      this.handleClientError(client, error);
    });
  }

  handleClientDisconnect(client: IClient): void {
    this.roomService.removeClientFromRoom(client);
    this.clientService.removeClient(client.id);
  }

  handleClientError(client: IClient, error: Error): void {
    console.error(`Client error: ${error.message}`);
    this.handleClientDisconnect(client);
  }

  stop(): void {
    if (this.wss) {
      this.wss.close();
    }
  }
}
