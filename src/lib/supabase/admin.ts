
// src/lib/supabase/admin.ts
"use server";

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { User } from '@/types/entities';
import type { AdminPendingEdit } from '@/types/entities';

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

const ITEMS_PER_PAGE_ADMIN = 15;

export async function getPendingEdits(options: { page?: number } = {}): Promise<{ edits: AdminPendingEdit[]; count: number | null }> {
  const supabase = createSupabaseServerClient();
  const page = options.page || 1;
  const from = (page - 1) * ITEMS_PER_PAGE_ADMIN;
  const to = from + ITEMS_PER_PAGE_ADMIN - 1;

  const { data, error, count } = await supabase
    .from('pending_edits')
    .select(`
      id,
      entity_type,
      proposed_data,
      change_reason,
      created_at,
      proposer_id,
      users (id, email, full_name)
    `)
    .eq('status', 'Pending')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching pending edits:", error.message, error.details);
    return { edits: [], count: 0 };
  }
  return { edits: data as AdminPendingEdit[], count };
}

export async function approveEdit(editId: number): Promise<{ success: boolean, error?: string }> {
  // Placeholder: Implement logic to:
  // 1. Fetch the pending_edit by editId.
  // 2. Determine the target table (e.g., 'politicians', 'parties') based on entity_type.
  // 3. Apply the 'proposed_data' to the target table's entity_id record.
  // 4. Update the pending_edit status to 'Approved'.
  // 5. Potentially award contribution points to the proposer.
  console.log(`Approving edit ${editId} - NOT IMPLEMENTED`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async work
  return { success: true }; // Placeholder
}

export async function denyEdit(editId: number, reason: string): Promise<{ success: boolean, error?: string }> {
  // Placeholder: Implement logic to:
  // 1. Update the pending_edit status to 'Denied'.
  // 2. Store the 'reason' in an admin_feedback field in pending_edits.
  console.log(`Denying edit ${editId} with reason: ${reason} - NOT IMPLEMENTED`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async work
  return { success: true }; // Placeholder
}


// Placeholder for user management functions
// export async function listUsers(options: { page?: number, limit?: number, search?: string }) { /* ... */ }
// export async function updateUserRole(userId: string, newRole: User['role']) { /* ... */ }
