import type { Server } from "node:http";
import { WebSocketServer } from "ws";
import type { GeneratedPaper, JobStatus } from "./types.js";

type JobEvent = {
  assignmentId: string;
  status: JobStatus;
  message?: string;
  paper?: GeneratedPaper;
};

let wss: WebSocketServer | undefined;

export function attachWebSockets(server: Server) {
  wss = new WebSocketServer({ server, path: "/ws" });
  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({ assignmentId: "system", status: "idle", message: "Connected" }));
  });
}

export function broadcast(event: JobEvent) {
  if (!wss) return;
  const payload = JSON.stringify(event);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(payload);
  }
}
