
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
    // IMPORTANT: Using a fixed password for prototype purposes only. NOT FOR PRODUCTION.
    const password = 'password123'; 

    toast({ title: "Attempting Login/Signup...", description: `Using email: ${email}`});

    // Try to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // If sign-in fails (e.g., user not found), try to sign up.
      // This is a simplified flow for prototyping.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { // This will be stored in user_metadata
            full_name: username,
            avatar_url: `https://placehold.co/100x100.png?text=${username.charAt(0).toUpperCase()}`,
          },
        },
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError.message);
        toast({ title: "Login/Sign up Failed", description: signUpError.message, variant: "destructive" });
        // onAuthStateChange will set isLoading to false eventually
      } else {
        // Sign up successful. onAuthStateChange will handle setting user state.
        // If "Confirm email" is OFF in Supabase, user is logged in.
        toast({ title: "Account Created & Logged In!", description: "Welcome to Netrika." });
      }
    } else {
      // Sign in successful. onAuthStateChange will handle setting user state.
      toast({ title: "Logged In Successfully!", description: "Welcome back to Netrika." });
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
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, supabase }}>
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
