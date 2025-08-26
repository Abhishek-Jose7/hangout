import { Server } from 'socket.io';
import { setIO, getIO } from '@/lib/io';

export default function handler(req, res) {
  // On serverless platforms like Vercel we cannot rely on long-lived socket servers.
  // If running on Vercel, return a no-op response and let clients fallback to polling or an external socket host.
  if (process.env.VERCEL) {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (res.socket.server.io) {
    // Already attached to Next's server
    setIO(res.socket.server.io);
    res.end();
    return;
  }

  const existing = getIO();
  if (existing) {
    res.socket.server.io = existing;
    res.end();
    return;
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;
  setIO(io);

  io.on('connection', (socket) => {
    socket.on('join-group', (groupId) => {
      socket.join(groupId);
    });
    socket.on('group-updated', (groupData) => {
      io.to(groupData.id).emit('group-updated', groupData);
    });
  });

  res.end();
}