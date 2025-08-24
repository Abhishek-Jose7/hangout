'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initSocket = async () => {
      try {
        // Initialize socket connection
        await fetch('/api/socket');
        
        const socketInstance = io();
        
        socketInstance.on('connect', () => {
          console.log('Socket connected with ID:', socketInstance.id);
          setIsConnected(true);
        });
        
        socketInstance.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });
        
        setSocket(socketInstance);
        
        return () => {
          socketInstance.disconnect();
        };
      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    };
    
    initSocket();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  return { socket, isConnected };
}