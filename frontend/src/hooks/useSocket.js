import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';

export const useSocket = (eventHandlers = {}) => {
  const socketRef = useRef(null);
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;
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

    // Use onAny so ANY real-time backend event immediately calls the latest handler
    socket.onAny((eventName, ...args) => {
      if (typeof handlersRef.current?.[eventName] === 'function') {
        handlersRef.current[eventName](...args);
      }
    });

    // Also explicitly bind common events to guarantee delivery across all transports
    const standardEvents = [
      'orderCreated',
      'orderStatusChanged',
      'orderStatusUpdated',
      'complaintUpdated',
      'newComplaint',
    ];

    standardEvents.forEach((eventName) => {
      socket.on(eventName, (...args) => {
        if (typeof handlersRef.current?.[eventName] === 'function') {
          handlersRef.current[eventName](...args);
        }
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.walletAddress, user?.role]);

  return socketRef.current;
};

