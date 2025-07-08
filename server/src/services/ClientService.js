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
      message: "Bem-vindo ao Ephero! Use /create para criar uma sala ou /join <roomId> para entrar em uma sala.",
    });
  }
}

module.exports = ClientService;
