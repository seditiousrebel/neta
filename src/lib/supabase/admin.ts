
// src/lib/supabase/admin.ts
"use server";

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { AdminPendingEdit } from '@/types/entities';
import type { Database, Tables } from '@/types/supabase'; // Assuming Tables type is available

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
    .select('user_role') // Select user_role
    .eq('id', authUser.id)
    .single();

  if (error) {
    console.error("Error fetching user profile for admin check:", error.message);
    return false; // Error fetching profile, assume not admin for safety
  }

  return userProfile?.user_role === 'Admin'; // Check user_role here
}

const ITEMS_PER_PAGE_ADMIN = 15;

export async function getPendingEdits(options: { page?: number } = {}): Promise<{ edits: AdminPendingEdit[]; count: number | null }> {
  const supabase = createSupabaseServerClient();
  const page = options.page || 1;
  const from = (page - 1) * ITEMS_PER_PAGE_ADMIN;
  const to = from + ITEMS_PER_PAGE_ADMIN - 1;

  const { data, error, count } = await supabase
    .from('pending_edits')
    .select(\`
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
    \`)
    .eq('status', 'Pending')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching pending edits:", error.message, error.details);
    return { edits: [], count: 0 };
  }
  return { edits: data as AdminPendingEdit[], count };
}

export async function approveEdit(editId: number): Promise<{
  success: boolean,
  error?: string,
  message?: string,
  entityType?: string,
  entityId?: number | string | null
}> {
  const supabase = createSupabaseServerClient();

  const { data: edit, error: fetchError } = await supabase
    .from('pending_edits')
    .select('*')
    .eq('id', editId)
    .single();

  if (fetchError || !edit) {
    console.error(\`Error fetching pending edit \${editId}:\`, fetchError?.message);
    return { success: false, error: \`Pending edit with ID \${editId} not found or fetch error.\` };
  }

  if (edit.status !== 'Pending') {
    return { success: false, error: \`Edit \${editId} is not in 'Pending' status.\` };
  }

  if (!edit.entity_id || !edit.proposed_data || !edit.entity_type) {
    return { success: false, error: \`Edit \${editId} is missing entity_id, proposed_data, or entity_type.\` };
  }

  let targetTable: keyof Database['public']['Tables'] | null = null;

  switch (edit.entity_type) {
    case 'Politician':
      targetTable = 'politicians';
      break;
    case 'Party':
      targetTable = 'parties';
      break;
    default:
      console.error(\`Unsupported entity_type for approval: \${edit.entity_type}\`);
      return { success: false, error: \`Entity type '\${edit.entity_type}' is not supported for approval.\` };
  }

  try {
    const updateData = edit.proposed_data as Omit<Tables<typeof targetTable>['Update'], 'id'>;

    const { error: updateError } = await supabase
      .from(targetTable)
      // @ts-ignore - Supabase types struggle with dynamic table names and data
      .update(updateData)
      .eq('id', edit.entity_id);

    if (updateError) {
      console.error(\`Error updating \${targetTable} with ID \${edit.entity_id}:\`, updateError.message);
      return { success: false, error: \`Failed to update \${edit.entity_type}: \${updateError.message}\` };
    }

    const { error: statusError } = await supabase
      .from('pending_edits')
      .update({
        status: 'Approved',
        admin_feedback: \`Approved by admin on \${new Date().toLocaleDateString()}\`,
        updated_at: new Date().toISOString()
      })
      .eq('id', editId);

    if (statusError) {
      console.error(\`Error updating status for edit \${editId}:\`, statusError.message);
      return { success: false, error: \`Entity updated, but failed to update edit status: \${statusError.message}\` };
    }

    return {
      success: true,
      message: \`\${edit.entity_type} with ID \${edit.entity_id} approved successfully.\`,
      entityType: edit.entity_type,
      entityId: edit.entity_id
    };

  } catch (e: any) {
    console.error(\`Unexpected error during approval process for edit \${editId}:\`, e.message);
    return { success: false, error: \`An unexpected error occurred: \${e.message}\` };
  }
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
    console.error(\`Error denying edit \${editId}:\`, error.message);
    return { success: false, error: error.message };
  }
  console.log(\`Edit \${editId} denied with reason: \${reason}\`);
  return { success: true };
}


// Placeholder for user management functions
// export async function listUsers(options: { page?: number, limit?: number, search?: string }) { /* ... */ }
// export async function updateUserRole(userId: string, newRole: User['role']) { /* ... */ }
