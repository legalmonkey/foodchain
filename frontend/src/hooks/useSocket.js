import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

export const useSocket = (eventHandlers = {}) => {
  const socketRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✓ Connected to FoodChain real-time socket server:', socket.id);
      if (user?.walletAddress) {
        socket.emit('joinUserRoom', user.walletAddress);
      }
      if (user?.role) {
        socket.emit('joinRoleRoom', user.role);
      }
    });

    // Register dynamic event listeners
    Object.entries(eventHandlers).forEach(([eventName, handler]) => {
      if (typeof handler === 'function') {
        socket.on(eventName, handler);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.walletAddress, user?.role]);

  return socketRef.current;
};
