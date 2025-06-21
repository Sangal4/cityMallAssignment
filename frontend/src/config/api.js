// Get the base URL for the API
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Default to production URL if no environment variable is set
  return 'https://disastercoordination.onrender.com/api';
};

// Get the WebSocket URL
const getWebSocketUrl = () => {
  if (import.meta.env.VITE_WEBSOCKET_URL) {
    return import.meta.env.VITE_WEBSOCKET_URL;
  }
  // Default to production URL if no environment variable is set
  return 'wss://disastercoordination.onrender.com';
};

export const API_URL = getBaseUrl();
export const WEBSOCKET_URL = getWebSocketUrl(); 