import type { Server as SocketIOServer } from 'socket.io';

declare global {
  var __ioServer: SocketIOServer | undefined;
}

export function setIO(io: SocketIOServer) {
  global.__ioServer = io;
}

export function getIO(): SocketIOServer | undefined {
  return global.__ioServer;
} 