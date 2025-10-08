'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSocketAvailable, setIsSocketAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSocketAvailability = async () => {
      try {
        const response = await fetch('/api/socket');
        if (response.status === 404) {
          // Socket.io not available (likely on Vercel)
          setIsSocketAvailable(false);
          setSocket(null);
          setIsConnected(false);
          return;
        }

        // Socket.io is available
        setIsSocketAvailable(true);
        const socketInstance = io();

        socketInstance.on('connect', () => {
          setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
          setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
          socketInstance.disconnect();
        };
      } catch (error) {
        console.error('Socket initialization error:', error);
        setIsSocketAvailable(false);
        setSocket(null);
        setIsConnected(false);
      }
    };

    checkSocketAvailability();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return { socket, isConnected, isSocketAvailable };
}