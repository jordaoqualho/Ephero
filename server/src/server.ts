import { createServer, IncomingMessage, ServerResponse } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { ClientService } from "./services/ClientService";
import { MessageHandler } from "./services/MessageHandler";
import { RoomService } from "./services/RoomService";
import { IClient, IEpheroServer } from "./types";

export class EpheroServer implements IEpheroServer {
  public port: number;
  public wss: WebSocketServer | null;
  public httpServer: any;
  public roomService: RoomService;
  public clientService: ClientService;
  public messageHandler: MessageHandler;

  constructor(port: number = 3000, defaultTTL: number = 5 * 60 * 1000) {
    this.port = port;
    this.wss = null;
    this.httpServer = null;
    this.roomService = new RoomService(defaultTTL);
    this.clientService = new ClientService();
    this.messageHandler = new MessageHandler(this.roomService, this.clientService);
  }

  start(): void {
    this.httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    });

    this.wss = new WebSocketServer({ server: this.httpServer });

    this.wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
      const client = this.clientService.createClient(ws);

      const url = new URL(request.url!, `http://${request.headers.host}`);
      const path = url.pathname;

      if (path.startsWith("/join/")) {
        const roomId = path.split("/")[2];
        if (roomId) {
          this.messageHandler.handleJoinRoom(client, { type: "join_room", roomId });
        } else {
          client.send({ type: "error", error: "Invalid room ID" });
        }
      } else if (path === "/create") {
        this.messageHandler.handleCreateRoom(client);
      } else {
        this.clientService.sendWelcomeMessage(client);
      }

      this.setupClientHandlers(client);
    });

    this.httpServer.listen(this.port, () => {
      console.log(`\n🎉 HTTP server running at http://localhost:${this.port}`);
      console.log(`🎉 WebSocket server running at ws://localhost:${this.port}`);
    });
  }

  setupClientHandlers(client: IClient): void {
    client.ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        console.log("📌 message → ", message);
        this.messageHandler.handleMessage(client, message);
      } catch {
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
    if (this.httpServer) {
      this.httpServer.close();
    }
    if (this.wss) {
      this.wss.close(() => {
        this.wss = null;
      });
    }
    this.roomService.destroy();
  }
}
