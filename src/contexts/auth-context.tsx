
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
  // Removed modal state managers
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
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
        // Prefer avatar_url from public.users, then user_metadata, then placeholder
        avatarUrl: userProfile?.avatar_url || authUser.user_metadata?.avatar_url || `https://placehold.co/100x100.png?text=${(userProfile?.full_name || authUser.user_metadata?.full_name || authUser.email || 'U').charAt(0).toUpperCase()}`,
        role: userProfile?.role || 'User', // Default to 'User' if not found
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
  }, [supabase]); // Removed toast from dependencies as it was causing re-renders

  useEffect(() => {
    setIsLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: SupabaseSession | null) => {
        await processSession(session);
         if (event === 'SIGNED_IN') {
          // Could add a welcome toast here if desired, but login/register pages will handle redirects
        } else if (event === 'SIGNED_OUT') {
          // setUser(null); setIsAuthenticated(false); // Already handled by processSession
        } else if (event === 'USER_UPDATED') {
          // Refetch profile if user metadata changed from server
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
    } else {
      // Toast is optional here as user will be redirected or UI will update
      // toast({ title: "Logged Out", description: "You have been successfully logged out." });
    }
    // onAuthStateChange will handle setting user to null and isAuthenticated to false, and isLoading to false.
    // Explicitly set to false to speed up UI update before potential redirect
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
