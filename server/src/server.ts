import * as fs from "fs";
import { createServer, IncomingMessage, ServerResponse } from "http";
import * as path from "path";
import { WebSocket, WebSocketServer } from "ws";
import { getSecurityConfig } from "./config/security";
import { AuditLogger } from "./services/AuditLogger";
import { ClientService } from "./services/ClientService";
import { MessageHandler } from "./services/MessageHandler";
import { MonitoringService } from "./services/MonitoringService";
import { RateLimiter } from "./services/RateLimiter";
import { RoomService } from "./services/RoomService";
import { IClient, IEpheroServer } from "./types";
import { InputValidator } from "./utils/validation";

export class EpheroServer implements IEpheroServer {
  public port: number;
  public wss: WebSocketServer | null;
  public httpServer: any;
  public roomService: RoomService;
  public clientService: ClientService;
  public messageHandler: MessageHandler;
  public rateLimiter: RateLimiter;
  public securityConfig: any;

  constructor(port: number = 4000, defaultTTL: number = 5 * 60 * 1000) {
    this.port = port;
    this.wss = null;
    this.httpServer = null;
    this.roomService = new RoomService(defaultTTL);
    this.clientService = new ClientService();
    this.messageHandler = new MessageHandler(this.roomService, this.clientService);
    this.rateLimiter = new RateLimiter();
    this.securityConfig = getSecurityConfig();
  }

  start(): void {
    this.httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("X-XSS-Protection", "1; mode=block");
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

      if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "ok",
            timestamp: new Date().toISOString(),
            security: {
              rateLimitEnabled: true,
              maxTextLength: this.securityConfig.MAX_TEXT_LENGTH,
              encryptionAlgorithm: this.securityConfig.ENCRYPTION.ALGORITHM,
            },
          })
        );
        return;
      }

      // Serve the web client
      if (req.url === "/" || req.url === "/index.html") {
        const webClientPath = path.join(__dirname, "../../web-client/index.html");
        if (fs.existsSync(webClientPath)) {
          const content = fs.readFileSync(webClientPath, "utf8");
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(content);
          return;
        }
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    });

    this.wss = new WebSocketServer({ server: this.httpServer });

    this.wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
      const startTime = Date.now();
      const clientIp = request.socket.remoteAddress || "unknown";
      const userAgent = request.headers["user-agent"] || "unknown";

      const client = this.clientService.createClient(ws);

      if (
        !this.rateLimiter.isAllowed(
          client.id,
          this.securityConfig.RATE_LIMIT.MAX_REQUESTS,
          this.securityConfig.RATE_LIMIT.WINDOW_MS
        )
      ) {
        AuditLogger.logRateLimitExceeded(client.id, clientIp);
        client.send({ type: "error", error: "Rate limit exceeded. Please try again later." });
        ws.close();
        return;
      }

      AuditLogger.logConnection(client.id, clientIp, userAgent);

      const url = new URL(request.url!, `http://${request.headers.host}`);
      const path = url.pathname;

      if (path.startsWith("/join/")) {
        const roomId = path.split("/")[2];
        if (roomId && InputValidator.validateRoomId(roomId)) {
          this.messageHandler.handleJoinRoomSecure(client, { type: "join-room", roomId });
        } else {
          AuditLogger.logSecurityThreat(client.id, "INVALID_ROOM_ID", { roomId });
          client.send({ type: "error", error: "Invalid room ID" });
        }
      } else if (path === "/create") {
        this.messageHandler.handleCreateRoomSecure(client);
      } else {
        this.clientService.sendWelcomeMessage(client);
      }

      this.setupClientHandlers(client);

      MonitoringService.logPerformance("websocket_connection", Date.now() - startTime);
    });

    this.httpServer.listen(this.port, () => {
      console.log(`\n🎉 HTTP server running at http://localhost:${this.port}`);
      console.log(`🎉 WebSocket server running at ws://localhost:${this.port}`);
    });
  }

  setupClientHandlers(client: IClient): void {
    client.ws.on("message", (data: Buffer) => {
      const startTime = Date.now();

      try {
        const message = JSON.parse(data.toString());

        if (!InputValidator.validateMessageType(message.type)) {
          AuditLogger.logSecurityThreat(client.id, "INVALID_MESSAGE_TYPE", { type: message.type });
          client.send({
            type: "error",
            error: "Invalid message type",
          });
          return;
        }

        if (message.payload && !InputValidator.validateText(message.payload, this.securityConfig.MAX_TEXT_LENGTH)) {
          AuditLogger.logSecurityThreat(client.id, "INVALID_PAYLOAD", {
            payloadLength: message.payload.length,
            maxLength: this.securityConfig.MAX_TEXT_LENGTH,
          });
          client.send({
            type: "error",
            error: "Invalid payload",
          });
          return;
        }

        console.log("📌 message → ", message);
        this.messageHandler.handleMessage(client, message);

        MonitoringService.logPerformance("message_processing", Date.now() - startTime);
      } catch (error) {
        AuditLogger.logSecurityThreat(client.id, "INVALID_JSON", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
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
    const clientIp = client.ws.url ? new URL(client.ws.url).hostname : "unknown";
    AuditLogger.logDisconnection(client.id, clientIp);
    this.roomService.removeClientFromRoom(client);
    this.clientService.removeClient(client.id);
  }

  handleClientError(client: IClient, error: Error): void {
    MonitoringService.logError(error, `Client ${client.id}`);
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
