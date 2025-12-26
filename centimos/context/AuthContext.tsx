import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';

type AuthContextType = {
  isAuthenticated: boolean;
  user: any; // In a real app, you'd have a proper User type
  login: (email: string, password: string) => void;
  logout: () => void;
  register: (email: string, password: string, name: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const colorScheme = useColorScheme();

  // Check if user is already authenticated on app start
  useEffect(() => {
    // In a real app, you'd check for stored tokens here
    // For now, we'll just set a default state
    const checkAuthStatus = async () => {
      // Simulate checking for stored auth data
      // const token = await AsyncStorage.getItem('authToken');
      // if (token) {
      //   setIsAuthenticated(true);
      //   // Fetch user data
      // }
    };

    checkAuthStatus();
  }, []);

  const login = (email: string, password: string) => {
    // In a real app, you'd make an API call to authenticate
    console.log('Login attempt with:', { email, password });
    setIsAuthenticated(true);
    setUser({ email, name: 'Test User' }); // Mock user data
  };

  const logout = () => {
    // In a real app, you'd clear stored tokens
    setIsAuthenticated(false);
    setUser(null);
  };

  const register = (email: string, password: string, name: string) => {
    // In a real app, you'd make an API call to register
    console.log('Register attempt with:', { email, password, name });
    setIsAuthenticated(true);
    setUser({ email, name });
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}