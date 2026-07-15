import { WebSocket, WebSocketServer } from "ws";

declare global {
  // allow global caching across module reloads in dev
  // eslint-disable-next-line no-var
  var __wss: WebSocketServer | undefined;
  // indicate initialization in progress to avoid races
  var __wssInit: boolean | undefined;
}

const DEFAULT_PORT = 3001;
const PORT = parseInt(process.env.WS_PORT || String(DEFAULT_PORT), 10);

if (!global.__wss && !global.__wssInit) {
  global.__wssInit = true;
  try {
    const wss = new WebSocketServer({ port: PORT });

    wss.on("connection", (ws) => {
      try {
        ws.send(JSON.stringify({ type: "hello", message: "ws connected" }));
      } catch (e) {
        // ignore
      }
    });

    wss.on("error", (err: any) => {
      // prevent unhandled exceptions from crashing the process
      // log and allow process to continue
      // eslint-disable-next-line no-console
      console.error(
        "WebSocket server error:",
        err && err.message ? err.message : err,
      );
    });

    global.__wss = wss;
    // eslint-disable-next-line no-console
    console.log(`WebSocket server started on ws://localhost:${PORT}`);
  } catch (err: any) {
    // Failed to bind (EADDRINUSE or other). Log and continue without crashing.
    // eslint-disable-next-line no-console
    console.error(
      "Failed to start WebSocket server:",
      err && err.message ? err.message : err,
    );
  } finally {
    global.__wssInit = false;
  }
}

export const wsServer = global.__wss as WebSocketServer;

export function broadcast(data: any) {
  const payload = JSON.stringify(data);
  if (!wsServer) return;
  wsServer.clients.forEach((client) => {
    // client is ws.WebSocket
    if ((client as WebSocket).readyState === WebSocket.OPEN) {
      (client as WebSocket).send(payload);
    }
  });
}

export function broadcastLock(lock: {
  fieldId: string;
  date: Date;
  startHour: number;
  endHour: number;
  expiresAt: Date;
}) {
  broadcast({ type: "lock", payload: lock });
}

export function broadcastUnlock(lock: {
  fieldId: string;
  date: Date;
  startHour: number;
  endHour: number;
}) {
  broadcast({ type: "unlock", payload: lock });
}

export default wsServer;
