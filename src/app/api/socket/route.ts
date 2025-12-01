import { NextResponse } from 'next/server';

export async function GET() {
  // Vercel doesn't support persistent WebSocket connections
  // Return 404 to indicate socket.io is not available
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error: 'Socket.io not available',
        message: 'Real-time features are disabled on this deployment platform. Consider using polling or WebSockets as a Service.'
      },
      { status: 404 }
    );
  }

  // For local development, you could set up socket.io here
  // But for now, we'll return 404 to be consistent
  return NextResponse.json(
    {
      error: 'Socket.io not available',
      message: 'Real-time features are disabled. The app will use polling for updates.'
    },
    { status: 404 }
  );
}
