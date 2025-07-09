import { EpheroServer } from "./server";

const server = new EpheroServer(8080);

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

server.start();
