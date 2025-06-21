import io from 'socket.io-client';
import { WEBSOCKET_URL } from './api';

export const createSocket = (options = {}) => {
  const socket = io(WEBSOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
    withCredentials: true,
    ...options
  });

  // Add default error handlers
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
}; 