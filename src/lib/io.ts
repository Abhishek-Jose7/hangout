import type { Server as SocketIOServer } from 'socket.io';

declare global {
  // eslint-disable-next-line no-var
  var __ioServer: SocketIOServer | undefined;
}

export function setIO(io: SocketIOServer) {
  global.__ioServer = io;
}

export function getIO(): SocketIOServer | undefined {
  return global.__ioServer;
} 