import { API_URL } from '../config/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `HTTP error! status: ${response.status}`
    }));
    throw new Error(error.message || 'Something went wrong');
  }
  return response.json();
};

const ensureLeadingSlash = (endpoint) => {
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
};

export const apiService = {
  get: async (endpoint) => {
    try {
      const response = await fetch(`${API_URL}${ensureLeadingSlash(endpoint)}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      return handleResponse(response);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  post: async (endpoint, data) => {
    try {
      const response = await fetch(`${API_URL}${ensureLeadingSlash(endpoint)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Add other methods as needed (PUT, DELETE, etc.)
}; 