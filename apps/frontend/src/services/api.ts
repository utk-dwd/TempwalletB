// frontend/src/services/api.ts
import axios from 'axios';
import { TelegramRegistrationPayload } from '../types/shared.js';

// Get backend URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Create a new Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add an interceptor to include the JWT in the Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const registerTelegram = async (payload: TelegramRegistrationPayload) => {
  const response = await api.post('/users/register-telegram', payload);
  return response.data;
};

export const getTelegramStatus = async () => {
  const response = await api.get('/users/telegram/status');
  return response.data;
};

export const updateTelegram = async (payload: TelegramRegistrationPayload) => {
  const response = await api.put('/users/telegram', payload);
  return response.data;
};

export default api;