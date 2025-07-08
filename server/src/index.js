const EpheroServer = require("./server");

const server = new EpheroServer(8080);
server.start();

process.on("SIGINT", () => {
  console.log("\nShutting down server...");
  server.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down server...");
  server.stop();
  process.exit(0);
});
