const crypto = require("crypto");

function generateRoomId() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

module.exports = { generateRoomId };
