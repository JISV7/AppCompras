import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from "jwt-decode";
import api from '@/services/api';
import { Alert } from 'react-native';

type User = {
  user_id: string;
  email: string;
  username: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to fetch full user details after we have a token
  const fetchUserProfile = async (token: string) => {
    try {
      // 1. Decode locally just to get the ID (optional, but good for fail-safe)
      const decoded: any = jwtDecode(token);
      
      // 2. Call the new Backend Endpoint
      // We set the Authorization header manually for this request
      const response = await api.get('/users/me', {
         headers: { Authorization: `Bearer ${token}` }
      });
      
      const userData = response.data;

      // 3. Update State with REAL data from DB
      setUser({ 
        user_id: userData.user_id, // or userData.id depending on your Schema
        email: userData.email,
        username: userData.username 
      });

    } catch (error) {
      console.log("Error fetching profile, falling back to token data", error);
      // Fallback if backend fails
      const decoded: any = jwtDecode(token);
      setUser({ 
         user_id: decoded.sub, 
         email: decoded.sub, 
         username: 'User' 
      });
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          await fetchUserProfile(token);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log('Failed to load token', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token } = response.data;
      await SecureStore.setItemAsync('token', access_token);

      // Fetch user details immediately to update UI name
      // (This fixes the "Hello, User" issue if we had a /me endpoint, 
      // but for now it at least standardizes the flow)
      await fetchUserProfile(access_token);
      
      setIsAuthenticated(true);
      
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Login failed';
      Alert.alert('Error', msg);
      throw error;
    }
  };

  const register = async (email: string, password: string, username: string) => {
    try {
      // Backend Register
      const response = await api.post('/auth/register', {
        email,
        password,
        username
      });
      
      // Auto-login flow
      // 1. We already have the user data from the register response!
      //    We can set it directly to avoid a "Hello User" flash.
      const newUser = response.data; // { user_id, email, username }
      
      // 2. Perform Login to get the Token
      await login(email, password); 

      // 3. Force update the user state with the correct name 
      //    (Login might overwrite it with "User" if token is missing data)
      setUser({
        user_id: newUser.user_id,
        email: newUser.email,
        username: newUser.username 
      });

    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Registration failed';
      Alert.alert('Error', msg);
      throw error;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}