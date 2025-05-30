
// src/lib/supabase/admin.ts
"use server";

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { User } from '@/types/entities';

/**
 * Checks if the currently authenticated user has the 'Admin' role.
 * This function is intended for use in Server Actions or Server Components
 * where you already have a Supabase client instance.
 *
 * @returns Promise<boolean> True if the user is an Admin, false otherwise.
 */
export async function isAdminUser(): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return false; // Not authenticated, so not an admin
  }

  // Fetch the user's profile from your public.users table
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (error) {
    console.error("Error fetching user profile for admin check:", error.message);
    return false; // Error fetching profile, assume not admin for safety
  }

  return userProfile?.role === 'Admin';
}

// Placeholder for future moderation functions.
// For example:
// export async function getPendingEdits(options: { page?: number, limit?: number }) { /* ... */ }
// export async function approveEdit(editId: string) { /* ... */ }
// export async function denyEdit(editId:string, reason: string) { /* ... */ }

// Placeholder for user management functions
// export async function listUsers(options: { page?: number, limit?: number, search?: string }) { /* ... */ }
// export async function updateUserRole(userId: string, newRole: User['role']) { /* ... */ }
