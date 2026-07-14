import { Response } from "express";

const clients = new Map<string, Response>();

export function addClient(userId: string, res: Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  clients.set(userId, res);
  const heartbeat = setInterval(() => res.write(":heartbeat\n\n"), 30000);
  res.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(userId);
  });
}

export function sendEvent(userId: string, event: string, data: unknown) {
  const client = clients.get(userId);
  if (client) {
    client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

export function removeClient(userId: string) {
  clients.delete(userId);
}
