import { WebSocket } from "ws";

export interface IClient {
  id: string;
  ws: WebSocket;
  roomId: string | null;
  joinedAt: number | null;
  assignToRoom(roomId: string): void;
  leaveRoom(): string | null;
  isInRoom(): boolean;
  send(message: MessageType): void;
  getInfo(): IClientInfo;
}

export interface IClientInfo {
  id: string;
  roomId: string | null;
  joinedAt: number | null;
}

export interface IRoom {
  id: string;
  clients: Set<IClient>;
  createdAt: number;
  lastActivity: number;
  maxClients: number;
  ttl: number;
  data?: string; // Store encrypted data
  addClient(client: IClient): boolean;
  removeClient(client: IClient): boolean;
  updateActivity(): void;
  isExpired(): boolean;
  getClientCount(): number;
  broadcast(message: MessageType, excludeClient?: IClient | null): void;
  destroy(): void;
  getTimeUntilExpiration(): number;
  setData(data: string): void;
  getData(): string | undefined;
}

export interface IRoomService {
  rooms: Map<string, IRoom>;
  createRoom(customTTL?: number): IRoom;
  getRoom(roomId: string): IRoom | undefined;
  removeRoom(roomId: string): void;
  addClientToRoom(roomId: string, client: IClient): { success: boolean; room?: IRoom; error?: string };
  removeClientFromRoom(client: IClient): IRoom | undefined;
  getActiveRooms(): IRoomInfo[];
  cleanupExpiredRooms(): void;
  setDefaultTTL(ttl: number): void;
  getDefaultTTL(): number;
  getRoomStats(): { totalRooms: number; activeRooms: number; expiredRooms: number };
  destroy(): void;
}

export interface IRoomInfo {
  id: string;
  clientsCount: number;
  createdAt: number;
  timeUntilExpiration?: number;
}

export interface IClientService {
  clients: Map<string, IClient>;
  createClient(ws: WebSocket): IClient;
  removeClient(clientId: string): void;
  getClient(clientId: string): IClient | undefined;
  getAllClients(): IClient[];
  sendWelcomeMessage(client: IClient): void;
}

export interface IMessageHandler {
  roomService: IRoomService;
  clientService: IClientService;
  handleMessage(client: IClient, data: IMessageData): void;
  handleCreateRoom(client: IClient): void;
  handleJoinRoom(client: IClient, data: IMessageData): void;
  handleLeaveRoom(client: IClient): void;
  handleGetRooms(client: IClient): void;
  handleBroadcastMessage(client: IClient, data: IMessageData): void;
}

export interface IEpheroServer {
  port: number;
  wss: unknown;
  roomService: IRoomService;
  clientService: IClientService;
  messageHandler: IMessageHandler;
  start(): void;
  stop(): void;
  setupClientHandlers(client: IClient): void;
  handleClientDisconnect(client: IClient): void;
  handleClientError(client: IClient, error: Error): void;
}

export interface IMessageData {
  type: string;
  roomId?: string;
  message?: string;
  payload?: string; // For encrypted data
}

export interface IWelcomeMessage {
  type: "welcome";
  message: string;
  clientId: string;
}

export interface IRoomCreatedMessage {
  type: "room_created";
  message: string;
  roomId: string;
}

export interface IRoomJoinedMessage {
  type: "room_joined";
  message: string;
  roomId: string;
  clientsCount: number;
}

export interface IRoomLeftMessage {
  type: "room_left";
  message: string;
}

export interface IUserJoinedMessage {
  type: "user_joined";
  userId: string;
}

export interface IUserLeftMessage {
  type: "user_left";
  userId: string;
}

export interface IMessageBroadcastMessage {
  type: "message";
  message: string;
  userId: string;
}

export interface IRoomsListMessage {
  type: "rooms_list";
  rooms: IRoomInfo[];
}

export interface IErrorMessage {
  type: "error";
  error: string;
}

// New message types for secure sharing
export interface IRoomCreatedSecureMessage {
  type: "room-created";
  roomId: string;
}

export interface IDataStoredMessage {
  type: "data-stored";
  roomId: string;
}

export interface IDataRetrievedMessage {
  type: "data-retrieved";
  roomId: string;
  payload: string;
}

export type MessageType =
  | IWelcomeMessage
  | IRoomCreatedMessage
  | IRoomJoinedMessage
  | IRoomLeftMessage
  | IUserJoinedMessage
  | IUserLeftMessage
  | IMessageBroadcastMessage
  | IRoomsListMessage
  | IErrorMessage
  | IRoomCreatedSecureMessage
  | IDataStoredMessage
  | IDataRetrievedMessage;
