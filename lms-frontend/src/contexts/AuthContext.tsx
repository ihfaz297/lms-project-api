import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@/lib/api';
import { mockUser } from '@/lib/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role: 'learner' | 'instructor' }) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // TODO: Replace with actual API call
    // const response = await authAPI.login(email, password);
    // localStorage.setItem('auth_token', response.token);
    // setUser(response.user);
    
    // Mock login for UI development
    const mockLoggedInUser = { ...mockUser, email };
    localStorage.setItem('user', JSON.stringify(mockLoggedInUser));
    setUser(mockLoggedInUser);
  };

  const register = async (data: { name: string; email: string; password: string; role: 'learner' | 'instructor' }) => {
    // TODO: Replace with actual API call
    // const response = await authAPI.register(data);
    // localStorage.setItem('auth_token', response.token);
    // setUser(response.user);
    
    // Mock register for UI development
    const newUser: User = {
      id: Date.now().toString(),
      name: data.name,
      email: data.email,
      role: data.role,
      hasBankSetup: false,
    };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, updateUser }}>
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
