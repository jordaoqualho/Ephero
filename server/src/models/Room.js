class Room {
  constructor(id) {
    this.id = id;
    this.clients = new Set();
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
    this.maxClients = 10;
    this.ttl = 30 * 60 * 1000;
  }

  addClient(client) {
    if (this.clients.size >= this.maxClients) {
      return false;
    }
    this.clients.add(client);
    this.lastActivity = Date.now();
    return true;
  }

  removeClient(client) {
    this.clients.delete(client);
    this.lastActivity = Date.now();
    return this.clients.size === 0;
  }

  isExpired() {
    return Date.now() - this.lastActivity > this.ttl;
  }

  getClientCount() {
    return this.clients.size;
  }

  broadcast(message, excludeClient = null) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client !== excludeClient && client.readyState === 1) {
        client.send(messageStr);
      }
    });
  }
}

module.exports = Room;
