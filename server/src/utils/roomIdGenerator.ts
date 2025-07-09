import { randomBytes } from "crypto";

export function generateRoomId(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}
