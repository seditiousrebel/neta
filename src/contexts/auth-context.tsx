
"use client";

import type { User } from '@/types/entities';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string)  => Promise<void>;
  logout: () => Promise<void>;
  supabase: SupabaseClient;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { toast } = useToast();

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const processSession = useCallback((session: Session | null) => {
    if (session?.user) {
      const appUser: User = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
        avatarUrl: session.user.user_metadata?.avatar_url || `https://placehold.co/100x100.png?text=${(session.user.user_metadata?.full_name || session.user.email || 'U').charAt(0).toUpperCase()}`,
      };
      setUser(appUser);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        processSession(session);
      }
    );

    // Check initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      processSession(session);
    };
    getInitialSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, processSession]);

  const login = async (username: string) => {
    setIsLoading(true);
    const email = `${username.replace(/\s+/g, '_').toLowerCase()}@example.com`;
    const password = 'password123'; 

    toast({ title: "Attempting Login/Signup...", description: `Using email: ${email}`});

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: username,
            avatar_url: `https://placehold.co/100x100.png?text=${username.charAt(0).toUpperCase()}`,
          },
        },
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError.message);
        toast({ title: "Login/Sign up Failed", description: signUpError.message, variant: "destructive" });
      } else {
        toast({ title: "Account Created & Logged In!", description: "Welcome to Netrika." });
        // Successfully signed up, onAuthStateChange will handle UI updates.
      }
    } else {
      toast({ title: "Logged In Successfully!", description: "Welcome back to Netrika." });
      // Successfully signed in, onAuthStateChange will handle UI updates.
    }
    // isLoading will be set to false by onAuthStateChange after processing the event.
  };

  const logout = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    }
    // onAuthStateChange will handle setting user to null and isAuthenticated to false, and isLoading to false.
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading, 
      login, 
      logout, 
      supabase,
      isLoginModalOpen,
      openLoginModal,
      closeLoginModal
    }}>
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
