import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.1.102:8000/api/v1'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Automatic Token Injector
// Before every request, check if we have a token and attach it
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Automatic Error Handler
// If the backend says "401 Unauthorized" (Token expired), force logout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      // Ideally, trigger a redirect to login here
    }
    return Promise.reject(error);
  }
);

export const getLatestExchangeRate = async () => {
  try {
    const response = await api.get('/exchange-rates/latest');
    return response.data; // Returns { currency_code, rate_to_ves, source, ... }
  } catch (error) {
    console.error("Failed to fetch rate:", error);
    return null; // Return null so the UI knows it failed (and can show fallback)
  }
};

export default api;