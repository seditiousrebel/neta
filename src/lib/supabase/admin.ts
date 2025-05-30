
// src/lib/supabase/admin.ts
"use server";

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { AdminPendingEdit } from '@/types/entities';
import type { Database, Tables } from '@/types/supabase';

export async function isAdminUser(): Promise<boolean> {
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return false;

  const { data: userProfile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single();
  if (error) {
    console.error("Error fetching user profile for admin check:", error.message);
    return false;
  }
  return userProfile?.role === 'Admin'; // Or 'Super Admin' if that's your role name
}

const ITEMS_PER_PAGE_ADMIN = 15;

export async function getPendingEdits(
  options: {
    page?: number;
    entityType?: string;
    excludeEntityType?: string; // New option to exclude a type
    dateFrom?: string;
    dateTo?: string;
    status?: "Pending" | "Approved" | "Denied" | ""; // Allow empty string for 'all'
    searchQuery?: string; // For politician name search
  } = {}
): Promise<{ edits: AdminPendingEdit[]; count: number | null }> {
  const supabase = createSupabaseServerClient();
  const page = options.page || 1;
  const { entityType, excludeEntityType, dateFrom, dateTo, status, searchQuery } = options;

  const from = (page - 1) * ITEMS_PER_PAGE_ADMIN;
  const to = from + ITEMS_PER_PAGE_ADMIN - 1;

  let query = supabase
    .from('pending_edits')
    .select(
      \`
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
    \`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status && (status === 'Approved' || status === 'Denied' || status === 'Pending')) {
    query = query.eq('status', status);
  }
  // If status is empty string or undefined, no status filter (fetches all statuses)

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }
  if (excludeEntityType) {
    query = query.not('entity_type', 'eq', excludeEntityType);
  }

  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) {
    const endOfDayDateTo = \`\${dateTo}T23:59:59.999Z\`;
    query = query.lte('created_at', endOfDayDateTo);
  }

  if (entityType === 'Politician' && searchQuery && searchQuery.trim() !== '') {
    // Case-insensitive search on the 'name' field within 'proposed_data' JSONB
    // Ensure the 'name' field is consistently present in proposed_data for politicians.
    query = query.ilike('proposed_data->>name', \`%\${searchQuery.trim()}%\`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching pending edits:", error.message, error.details);
    return { edits: [], count: 0 };
  }
  
  return { edits: data as AdminPendingEdit[], count };
}

// approveEdit remains largely the same but ensures it handles various entity types if needed
export async function approveEdit(editId: number): Promise<{
  success: boolean,
  error?: string,
  message?: string,
  entityType?: string,
  entityId?: number | string | null
}> {
  const supabase = createSupabaseServerClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) return { success: false, error: "Admin not authenticated." };

  const { data: edit, error: fetchError } = await supabase
    .from('pending_edits')
    .select('*')
    .eq('id', editId)
    .single();

  if (fetchError || !edit) {
    return { success: false, error: \`Pending edit ID \${editId} not found.\` };
  }
  if (edit.status !== 'Pending') {
    return { success: false, error: \`Edit \${editId} is not Pending.\` };
  }
  if (!edit.entity_id || !edit.proposed_data || !edit.entity_type) {
    return { success: false, error: \`Edit \${editId} is missing key data.\` };
  }

  let targetTable: keyof Database['public']['Tables'] | null = null;
  switch (edit.entity_type) {
    case 'Politician': targetTable = 'politicians'; break;
    case 'Party': targetTable = 'parties'; break;
    // Add other entity types here
    default: return { success: false, error: \`Unsupported entity_type: \${edit.entity_type}\` };
  }

  try {
    const { error: updateError } = await supabase
      .from(targetTable)
      .update(edit.proposed_data as any) // Cast as 'any' for dynamic data, ensure it matches table schema
      .eq('id', edit.entity_id);

    if (updateError) return { success: false, error: \`Failed to update \${edit.entity_type}: \${updateError.message}\` };

    const { error: statusError } = await supabase
      .from('pending_edits')
      .update({
        status: 'Approved',
        admin_feedback: \`Approved by admin \${adminUser.id} on \${new Date().toLocaleDateString()}\`,
        updated_at: new Date().toISOString(),
        moderator_id: adminUser.id,
      })
      .eq('id', editId);

    if (statusError) return { success: false, error: \`Entity updated, but failed to update edit status: \${statusError.message}\` };

    // Create entity revision for the approved edit
    const { error: revisionError } = await supabase.from('entity_revisions').insert({
      entity_type: edit.entity_type,
      entity_id: String(edit.entity_id), // Ensure entity_id is string if DB expects it
      data: edit.proposed_data,
      submitter_id: edit.proposer_id,
      approver_id: adminUser.id,
      edit_id: edit.id,
    });
    if (revisionError) console.warn(\`Failed to create entity revision for edit \${editId}:\`, revisionError.message);


    return {
      success: true,
      message: \`\${edit.entity_type} ID \${edit.entity_id} approved.\`,
      entityType: edit.entity_type,
      entityId: edit.entity_id
    };
  } catch (e: any) {
    return { success: false, error: \`Unexpected error: \${e.message}\` };
  }
}

export async function denyEdit(editId: number, reason: string): Promise<{ success: boolean, error?: string }> {
  const supabase = createSupabaseServerClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) return { success: false, error: "Admin not authenticated." };

  const { error } = await supabase
    .from('pending_edits')
    .update({
      status: 'Denied',
      admin_feedback: reason,
      updated_at: new Date().toISOString(),
      moderator_id: adminUser.id,
    })
    .eq('id', editId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
