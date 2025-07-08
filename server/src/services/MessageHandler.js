const MESSAGE_TYPES = require("../utils/messageTypes");

class MessageHandler {
  constructor(roomService, clientService) {
    this.roomService = roomService;
    this.clientService = clientService;
  }

  handleMessage(client, data) {
    const handlers = {
      [MESSAGE_TYPES.CREATE_ROOM]: () => this.handleCreateRoom(client),
      [MESSAGE_TYPES.JOIN_ROOM]: (data) => this.handleJoinRoom(client, data),
      [MESSAGE_TYPES.MESSAGE]: (data) => this.handleMessage(client, data),
      [MESSAGE_TYPES.LEAVE_ROOM]: () => this.handleLeaveRoom(client),
      [MESSAGE_TYPES.GET_ROOMS]: () => this.handleGetRooms(client),
    };

    const handler = handlers[data.type];
    if (handler) {
      return handler(data);
    }

    client.send({
      type: MESSAGE_TYPES.ERROR,
      error: "Unknown message type",
    });
  }

  handleCreateRoom(client) {
    const room = this.roomService.createRoom();
    client.send({
      type: MESSAGE_TYPES.ROOM_CREATED,
      roomId: room.id,
      message: `Room ${room.id} created successfully!`,
    });
  }

  handleJoinRoom(client, data) {
    const result = this.roomService.addClientToRoom(data.roomId, client);

    if (result.success) {
      client.assignToRoom(data.roomId);

      const room = result.room;
      room.broadcast(
        {
          type: MESSAGE_TYPES.USER_JOINED,
          userId: client.id,
          timestamp: Date.now(),
        },
        client
      );

      client.send({
        type: MESSAGE_TYPES.ROOM_JOINED,
        roomId: data.roomId,
        message: `Joined room ${data.roomId}`,
        clientsCount: room.getClientCount(),
      });
    } else {
      client.send({
        type: MESSAGE_TYPES.ERROR,
        error: result.error,
      });
    }
  }

  handleMessage(client, data) {
    if (!client.isInRoom()) {
      client.send({
        type: MESSAGE_TYPES.ERROR,
        error: "You must be in a room to send messages",
      });
      return;
    }

    const room = this.roomService.getRoom(client.roomId);
    room.broadcast(
      {
        type: MESSAGE_TYPES.MESSAGE,
        userId: client.id,
        message: data.message,
        timestamp: Date.now(),
      },
      client
    );
  }

  handleLeaveRoom(client) {
    if (!client.isInRoom()) return;

    const room = this.roomService.removeClientFromRoom(client);
    if (room) {
      room.broadcast({
        type: MESSAGE_TYPES.USER_LEFT,
        userId: client.id,
        timestamp: Date.now(),
      });
    }

    client.leaveRoom();
    client.send({
      type: MESSAGE_TYPES.ROOM_LEFT,
      message: "You left the room",
    });
  }

  handleGetRooms(client) {
    const rooms = this.roomService.getActiveRooms();
    client.send({
      type: MESSAGE_TYPES.ROOMS_LIST,
      rooms,
    });
  }
}

module.exports = MessageHandler;
