import { Server } from 'socket.io';

export default function handler(req, res) {
  // Vercel doesn't support persistent WebSocket connections
  // Return 404 to indicate socket.io is not available
  if (process.env.VERCEL) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Socket.io not available',
      message: 'Real-time features are disabled on this deployment platform. Consider using polling or WebSockets as a Service.'
    }));
    return;
  }

  if (res.socket.server.io) {
    console.log('Socket is already running');
    res.end();
    return;
  }

  console.log('Setting up socket');
  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-group', (groupId) => {
      socket.join(groupId);
      console.log(`Socket ${socket.id} joined group ${groupId}`);
    });

    socket.on('group-updated', (groupData) => {
      console.log('Group updated:', groupData.code);
      io.to(groupData.id).emit('group-updated', groupData);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  console.log('Socket set up successfully');
  res.end();
}