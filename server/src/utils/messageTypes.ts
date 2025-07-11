export const MESSAGE_TYPES = {
  CREATE_ROOM: "create_room",
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  MESSAGE: "message",
  GET_ROOMS: "get_rooms",
  // New message types for secure sharing
  CREATE_ROOM_SECURE: "create-room",
  ROOM_CREATED: "room-created",
  SEND_DATA: "send-data",
  DATA_STORED: "data-stored",
  JOIN_ROOM_SECURE: "join-room",
  DATA_RETRIEVED: "data-retrieved",
} as const;

export type MessageTypeKey = keyof typeof MESSAGE_TYPES;
export type MessageTypeValue = (typeof MESSAGE_TYPES)[MessageTypeKey];
