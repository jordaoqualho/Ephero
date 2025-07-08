const Client = require("../models/Client");

class ClientService {
  constructor() {
    this.clients = new Map();
  }

  createClient(ws) {
    const client = new Client(ws);
    this.clients.set(client.id, client);
    return client;
  }

  removeClient(clientId) {
    this.clients.delete(clientId);
  }

  getClient(clientId) {
    return this.clients.get(clientId);
  }

  getAllClients() {
    return Array.from(this.clients.values());
  }

  sendWelcomeMessage(client) {
    client.send({
      type: "welcome",
      clientId: client.id,
      message: "Welcome to Ephero! Use /create to create a room or /join <roomId> to join a room.",
    });
  }
}

module.exports = ClientService;
