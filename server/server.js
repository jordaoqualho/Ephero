const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", function connection(ws) {
  console.log("Novo cliente conectado");
  ws.send("Bem-vindo ao servidor WebSocket!");

  ws.on("message", function incoming(message) {
    console.log("Mensagem recebida do cliente:", message.toString());
    ws.send(`Servidor recebeu: ${message}`);
  });

  ws.on("close", function () {
    console.log("Cliente desconectado");
  });
});

console.log("Servidor WebSocket rodando em ws://localhost:8080");
