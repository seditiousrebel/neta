
"use client";

import type { User } from '@/types/entities';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { SupabaseClient, AuthChangeEvent, Session as SupabaseSession } from '@supabase/supabase-js'; // Renamed Session to avoid conflict
import { useToast } from "@/hooks/use-toast";
import type { Database, Tables } from '@/types/supabase'; // Ensure this path is correct

type UserProfile = Tables<'users'>['Row'];

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

  const fetchUserProfile = async (userId: string): Promise<Partial<UserProfile> | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, contribution_points, avatar_url, bio') // Ensure 'role' is selected
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[AuthContext] Error fetching user profile from DB:', error.message);
      return null;
    }
    return data;
  };

  const processSession = useCallback(async (session: SupabaseSession | null) => {
    setIsLoading(true);
    if (session?.user) {
      const authUser = session.user;
      console.log('[AuthContext] Processing session for authUser ID:', authUser.id);
      const userProfile = await fetchUserProfile(authUser.id);
      console.log('[AuthContext] Fetched userProfile from DB:', userProfile); // Diagnostic log

      const appUser: User = {
        id: authUser.id,
        email: authUser.email,
        name: userProfile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        avatarUrl: userProfile?.avatar_url || authUser.user_metadata?.avatar_url || `https://placehold.co/100x100.png?text=${(userProfile?.full_name || authUser.user_metadata?.full_name || authUser.email || 'U').charAt(0).toUpperCase()}`,
        role: userProfile?.role || 'User', // Uses the 'role' column from public.users
        contributionPoints: userProfile?.contribution_points || 0,
        bio: userProfile?.bio || (authUser.user_metadata?.bio as string) || null,
      };
      setUser(appUser);
      setIsAuthenticated(true);
      console.log('[AuthContext] Set appUser in context:', appUser); // Diagnostic log
      console.log('[AuthContext] Effective role set in context:', appUser.role); // Specifically log the role
    } else {
      setUser(null);
      setIsAuthenticated(false);
      console.log('[AuthContext] No active session or user.'); // Diagnostic log
    }
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]); // supabase should be a dependency

  useEffect(() => {
    setIsLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: SupabaseSession | null) => {
        console.log('[AuthContext] Auth event received:', event, 'Session present:', !!session); // Diagnostic log
        await processSession(session);
         if (event === 'SIGNED_IN') {
           console.log('[AuthContext] Event SIGNED_IN processed.');
        } else if (event === 'SIGNED_OUT') {
           console.log('[AuthContext] Event SIGNED_OUT processed.');
        } else if (event === 'USER_UPDATED') {
           console.log('[AuthContext] Event USER_UPDATED received.');
           if (session?.user) await processSession(session);
        }
      }
    );

    const getInitialSession = async () => {
      console.log('[AuthContext] Getting initial session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[AuthContext] Initial session data:', session ? `User ID: ${session.user.id}` : 'No session');
      await processSession(session);
    };
    getInitialSession();

    return () => {
      console.log('[AuthContext] Unsubscribing from auth state changes.');
      subscription?.unsubscribe();
    };
  }, [supabase, processSession]);


  const logout = async () => {
    setIsLoading(true);
    console.log('[AuthContext] Initiating logout...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[AuthContext] Logout error:', error.message);
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    } else {
      console.log('[AuthContext] Logout successful.');
    }
    // processSession will handle setting user to null via onAuthStateChange SIGNED_OUT event
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

