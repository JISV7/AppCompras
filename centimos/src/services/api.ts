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
  } catch (error: any) {
    if (error.response?.status === 404) {
      // 404 is expected when no exchange rate data exists yet
      console.log("No exchange rate data available yet");
      return null; // Return null so the UI knows it failed (and can show fallback)
    } else {
      console.error("Failed to fetch rate:", error);
      return null; // Return null so the UI knows it failed (and can show fallback)
    }
  }
};

export interface Product {
  barcode: string;
  name: string;
  brand?: string;
  image_url?: string;
  data_source: string;
  estimated_price_usd?: number;
  predicted_price_usd?: number;
}

export const getProduct = async (barcode: string): Promise<Product | null> => {
  try {
    const response = await api.get(`/products/${barcode}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // Product truly doesn't exist anywhere
    }
    // For 500 errors, log more details but still throw the error
    if (error.response?.status === 500) {
      console.error(`Server error when searching for product with barcode ${barcode}:`, error.response.data);
    } else {
      console.error(`Failed to get product with barcode ${barcode}:`, error);
    }
    throw error; // Network error or other issue
  }
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  try {
    const response = await api.get('/products/', { params: { q: query } });
    return response.data;
  } catch (error) {
    console.error("Failed to search products", error);
    return [];
  }
};

export const getExchangeRateHistory = async (limit: number = 30) => {
  try {
    const response = await api.get('/exchange-rates/history', { params: { limit } });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch exchange rate history", error);
    return [];
  }
};

export const reportPrice = async (barcode: string, storeId: string, price: number) => {
  try {
    const response = await api.post('/prices/', {
      product_barcode: barcode,
      store_id: storeId,
      price: price,
      currency: 'USD'
    });
    return response.data;
  } catch (error) {
    console.error("Failed to report price", error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/users/me'); // Standard FastAPI endpoint
    return response.data;
  } catch (error) {
    console.error("Failed to fetch profile", error);
    return null;
  }
};

interface Store {
  store_id: string;
  name: string;
}

export const getStores = async (): Promise<Store[]> => {
  try {
    const response = await api.get('/stores/');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch stores", error);
    return [];
  }
};

export const searchStores = async (query: string): Promise<Store[]> => {
  try {
    const response = await api.get('/stores/', { params: { q: query } });
    return response.data;
  } catch (error) {
    console.error("Failed to search stores", error);
    return [];
  }
};

export const getNearbyStores = async (lat: number, lon: number, radius: number = 2345): Promise<Store[]> => {
  try {
    const response = await api.get('/stores/nearby', { 
      params: { lat, lon, radius_meters: radius } 
    });
    return response.data;
  } catch (error) {
    console.error("Failed to get nearby stores", error);
    return [];
  }
};

export const createStore = async (name: string, address: string, latitude: number, longitude: number): Promise<Store | null> => {
  try {
    const response = await api.post('/stores/', {
      name,
      address,
      latitude,
      longitude
    });
    return response.data;
  } catch (error) {
    console.error("Failed to create store", error);
    throw error;
  }
};

export default api;