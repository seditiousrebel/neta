
// src/lib/supabase/admin.ts
"use server";

import { createSupabaseServerClient } from '@/lib/supabase/server';
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
      entity_id,
      proposed_data,
      change_reason,
      created_at,
      proposer_id,
      status,
      admin_feedback,
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
  const supabase = createSupabaseServerClient();
  // Example:
  // const { data: edit, error: fetchError } = await supabase.from('pending_edits').select('*').eq('id', editId).single();
  // if (fetchError || !edit) return { success: false, error: "Edit not found" };
  // if (edit.entity_type === 'politician' && edit.entity_id && edit.proposed_data) {
  //   const { error: updateError } = await supabase.from('politicians').update(edit.proposed_data as any).eq('id', edit.entity_id);
  //   if (updateError) return { success: false, error: `Failed to update politician: ${updateError.message}`};
  // }
  // const { error: statusError } = await supabase.from('pending_edits').update({ status: 'Approved', admin_feedback: 'Approved by admin' }).eq('id', editId);
  // if (statusError) return { success: false, error: `Failed to update edit status: ${statusError.message}`};
  
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async work
  return { success: true }; // Placeholder
}

export async function denyEdit(editId: number, reason: string): Promise<{ success: boolean, error?: string }> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from('pending_edits')
    .update({ 
      status: 'Denied', 
      admin_feedback: reason,
      updated_at: new Date().toISOString() 
    })
    .eq('id', editId);

  if (error) {
    console.error(`Error denying edit ${editId}:`, error.message);
    return { success: false, error: error.message };
  }
  console.log(`Edit ${editId} denied with reason: ${reason}`);
  return { success: true };
}


// Placeholder for user management functions
// export async function listUsers(options: { page?: number, limit?: number, search?: string }) { /* ... */ }
// export async function updateUserRole(userId: string, newRole: User['role']) { /* ... */ }

    