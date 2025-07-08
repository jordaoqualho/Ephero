const crypto = require("crypto");

class Client {
  constructor(ws) {
    this.id = crypto.randomBytes(8).toString("hex");
    this.ws = ws;
    this.roomId = null;
    this.joinedAt = null;
  }

  assignToRoom(roomId) {
    this.roomId = roomId;
    this.joinedAt = Date.now();
  }

  leaveRoom() {
    const roomId = this.roomId;
    this.roomId = null;
    this.joinedAt = null;
    return roomId;
  }

  isInRoom() {
    return this.roomId !== null;
  }

  send(message) {
    if (this.ws.readyState === 1) {
      this.ws.send(JSON.stringify(message));
    }
  }

  getInfo() {
    return {
      id: this.id,
      roomId: this.roomId,
      joinedAt: this.joinedAt,
    };
  }
}

module.exports = Client;
