import { IClient, IClientService, IMessageData, IMessageHandler, IRoomService } from "../types";
import { MESSAGE_TYPES } from "../utils/messageTypes";

export class MessageHandler implements IMessageHandler {
  public roomService: IRoomService;
  public clientService: IClientService;

  constructor(roomService: IRoomService, clientService: IClientService) {
    this.roomService = roomService;
    this.clientService = clientService;
  }

  handleMessage(client: IClient, data: IMessageData): void {
    const handlers: Record<string, (client: IClient, data: IMessageData) => void> = {
      [MESSAGE_TYPES.CREATE_ROOM]: (client) => this.handleCreateRoom(client),
      [MESSAGE_TYPES.JOIN_ROOM]: (client, data) => this.handleJoinRoom(client, data),
      [MESSAGE_TYPES.LEAVE_ROOM]: (client) => this.handleLeaveRoom(client),
      [MESSAGE_TYPES.GET_ROOMS]: (client) => this.handleGetRooms(client),
      [MESSAGE_TYPES.MESSAGE]: (client, data) => this.handleBroadcastMessage(client, data),
      // New handlers for secure sharing
      [MESSAGE_TYPES.CREATE_ROOM_SECURE]: (client) => this.handleCreateRoomSecure(client),
      [MESSAGE_TYPES.SEND_DATA]: (client, data) => this.handleSendData(client, data),
      [MESSAGE_TYPES.JOIN_ROOM_SECURE]: (client, data) => this.handleJoinRoomSecure(client, data),
    };

    const handler = handlers[data.type];
    if (handler) {
      handler(client, data);
    } else {
      client.send({
        type: "error",
        error: `Unknown message type: ${data.type}`,
      });
    }
  }

  handleCreateRoomSecure(client: IClient): void {
    const room = this.roomService.createRoom();
    const result = this.roomService.addClientToRoom(room.id, client);

    if (result.success) {
      client.send({
        type: "room-created",
        roomId: room.id,
      });
    } else {
      client.send({
        type: "error",
        error: result.error || "Failed to create room",
      });
    }
  }

  handleSendData(client: IClient, data: IMessageData): void {
    if (!data.roomId) {
      client.send({
        type: "error",
        error: "Room ID is required",
      });
      return;
    }

    if (!data.payload) {
      client.send({
        type: "error",
        error: "Payload is required",
      });
      return;
    }

    const room = this.roomService.getRoom(data.roomId);
    if (!room) {
      client.send({
        type: "error",
        error: "Room not found",
      });
      return;
    }

    // Store the encrypted data in the room
    room.setData(data.payload);

    client.send({
      type: "data-stored",
      roomId: data.roomId,
    });
  }

  handleJoinRoomSecure(client: IClient, data: IMessageData): void {
    if (!data.roomId) {
      client.send({
        type: "error",
        error: "Room ID is required",
      });
      return;
    }

    const result = this.roomService.addClientToRoom(data.roomId, client);

    if (result.success && result.room) {
      // Send the stored data to the client
      const storedData = result.room.getData();
      if (storedData) {
        client.send({
          type: "data-retrieved",
          roomId: data.roomId,
          payload: storedData,
        });
      } else {
        client.send({
          type: "error",
          error: "No data found in room",
        });
      }
    } else {
      client.send({
        type: "error",
        error: result.error || "Failed to join room",
      });
    }
  }

  handleCreateRoom(client: IClient): void {
    const room = this.roomService.createRoom();
    const result = this.roomService.addClientToRoom(room.id, client);

    if (result.success) {
      client.send({
        type: "room_created",
        message: "Room created successfully",
        roomId: room.id,
      });

      room.broadcast(
        {
          type: "user_joined",
          userId: client.id,
        },
        client
      );
    } else {
      client.send({
        type: "error",
        error: result.error || "Failed to create room",
      });
    }
  }

  handleJoinRoom(client: IClient, data: IMessageData): void {
    if (!data.roomId) {
      client.send({
        type: "error",
        error: "Room ID is required",
      });
      return;
    }

    const result = this.roomService.addClientToRoom(data.roomId, client);

    if (result.success && result.room) {
      client.send({
        type: "room_joined",
        message: "Successfully joined room",
        roomId: data.roomId,
        clientsCount: result.room.getClientCount(),
      });

      result.room.broadcast(
        {
          type: "user_joined",
          userId: client.id,
        },
        client
      );
    } else {
      client.send({
        type: "error",
        error: result.error || "Failed to join room",
      });
    }
  }

  handleBroadcastMessage(client: IClient, data: IMessageData): void {
    if (!client.roomId) {
      client.send({
        type: "error",
        error: "You must be in a room to send messages",
      });
      return;
    }

    if (!data.message) {
      client.send({
        type: "error",
        error: "Message content is required",
      });
      return;
    }

    const room = this.roomService.getRoom(client.roomId);
    if (!room) {
      client.send({
        type: "error",
        error: "Room not found",
      });
      return;
    }

    room.broadcast(
      {
        type: "message",
        message: data.message,
        userId: client.id,
      },
      client
    );
  }

  handleLeaveRoom(client: IClient): void {
    if (!client.roomId) {
      client.send({
        type: "error",
        error: "You are not in a room",
      });
      return;
    }

    const room = this.roomService.removeClientFromRoom(client);
    if (room) {
      room.broadcast({
        type: "user_left",
        userId: client.id,
      });

      client.send({
        type: "room_left",
        message: "Successfully left room",
      });
    } else {
      client.send({
        type: "error",
        error: "Failed to leave room",
      });
    }
  }

  handleGetRooms(client: IClient): void {
    const rooms = this.roomService.getActiveRooms();
    client.send({
      type: "rooms_list",
      rooms,
    });
  }
}
