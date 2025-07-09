export const MESSAGE_TYPES = {
  CREATE_ROOM: "create_room",
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  MESSAGE: "message",
  GET_ROOMS: "get_rooms",
} as const;

export type MessageTypeKey = keyof typeof MESSAGE_TYPES;
export type MessageTypeValue = (typeof MESSAGE_TYPES)[MessageTypeKey];
