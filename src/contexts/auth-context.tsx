
"use client";

import type { User } from '@/types/entities';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { SupabaseClient, AuthChangeEvent, Session as SupabaseSession } from '@supabase/supabase-js'; // Renamed Session to avoid conflict
import { useToast } from "@/hooks/use-toast";
import type { Database } from '@/types/supabase'; // Ensure this path is correct

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
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

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    // Select all columns, but be aware if some don't exist (like avatar_url or bio)
    const { data, error } = await supabase
      .from('users')
      .select('*') 
      .eq('id', userId)
      .maybeSingle(); 
    if (error) {
      console.error('Error fetching user profile:', error.message);
      return null;
    }
    return data;
  };

  const processSession = useCallback(async (session: SupabaseSession | null) => {
    setIsLoading(true);
    if (session?.user) {
      const authUser = session.user;
      const userProfile = await fetchUserProfile(authUser.id);

      const appUser: User = {
        id: authUser.id,
        email: authUser.email,
        name: userProfile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        // Prefer avatar_url from auth metadata, then placeholder
        avatarUrl: authUser.user_metadata?.avatar_url || `https://placehold.co/100x100.png?text=${(userProfile?.full_name || authUser.user_metadata?.full_name || authUser.email || 'U').charAt(0).toUpperCase()}`,
        // Prefer bio from auth metadata, then null
        bio: (authUser.user_metadata?.bio as string) || userProfile?.bio || null,
        role: userProfile?.role || 'User', 
        contributionPoints: userProfile?.contribution_points || 0,
      };
      setUser(appUser);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]); 

  useEffect(() => {
    setIsLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: SupabaseSession | null) => {
        await processSession(session);
         if (event === 'SIGNED_IN') {
        } else if (event === 'SIGNED_OUT') {
        } else if (event === 'USER_UPDATED') {
           if (session?.user) await processSession(session);
        }
      }
    );

    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await processSession(session);
    };
    getInitialSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, processSession]);


  const logout = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    }
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading, 
      logout, 
      supabase,
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
