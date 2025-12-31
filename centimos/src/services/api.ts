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

export const getProduct = async (barcode: string) => {
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
  // For now, return hardcoded stores. Later connect to backend.
  return [
    { store_id: "3d4f8bb4-6ca6-47f4-85db-6663023a241c", name: "Farmatodo" },
    { store_id: "de96f594-1a77-4975-9cb3-62eeac52eec6", name: "Bio Mercado" },
    { store_id: "86340cab-4d7e-4fa2-8c1a-c54e0d9021a8", name: "Excelsior Gama" },
  ];
  // try {
  //   const response = await api.get('/stores/');
  //   return response.data;
  // } catch (error) {
  //   console.error("Failed to fetch stores", error);
  //   return [];
  // }
};

export default api;