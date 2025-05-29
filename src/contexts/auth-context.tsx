
"use client";

import type { User } from '@/types/entities';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (name: string)  => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Simulate initial loading

  useEffect(() => {
    // Simulate checking auth status on mount
    const storedAuth = localStorage.getItem('netrika-auth');
    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      setUser(authData.user);
      setIsAuthenticated(authData.isAuthenticated);
    }
    setIsLoading(false);
  }, []);

  const login = (name: string) => {
    const dummyUser: User = { id: '1', name: name, email: `${name.toLowerCase().replace(' ', '.')}@example.com`, avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}` };
    setUser(dummyUser);
    setIsAuthenticated(true);
    localStorage.setItem('netrika-auth', JSON.stringify({ user: dummyUser, isAuthenticated: true }));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('netrika-auth');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
