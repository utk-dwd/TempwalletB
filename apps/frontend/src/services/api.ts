// frontend/src/services/api.ts
import axios from 'axios';
import { TelegramRegistrationPayload } from '../types/shared.js';

// Get backend URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Temporary debugging - remove after fixing
console.log('🔧 DEBUG: Environment variables available:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  all_env_vars: import.meta.env
});
console.log('🔧 DEBUG: Using API_BASE_URL:', API_BASE_URL);

// Create a new Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add an interceptor to include the JWT in the Authorization header
api.interceptors.request.use(
  (config) => {
    // Temporary debugging - remove after fixing
    console.log('🔧 DEBUG: Making API request to:', config.baseURL + config.url);
    console.log('🔧 DEBUG: Full config:', config);
    
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('🔧 DEBUG: API response successful:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('🔧 DEBUG: API request failed:', {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config?.baseURL + error.config?.url,
      error: error.message,
      code: error.code
    });
    return Promise.reject(error);
  }
);

export const registerTelegram = async (payload: TelegramRegistrationPayload) => {
  const response = await api.post('/users/register-telegram', payload);
  return response.data;
};

export default api;