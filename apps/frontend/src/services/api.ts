// frontend/src/services/api.ts
import axios from 'axios';
import { TelegramRegistrationPayload } from '@tempwallet/shared';

// Create a new Axios instance
const api = axios.create({
  baseURL: '/api',
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

export default api;