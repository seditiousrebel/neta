
"use server";

import { revalidatePath } from "next/cache";
import { denyEdit, approveEdit } from "@/lib/supabase/admin"; 
import { createSupabaseServerClient } from "../supabase/server";
import type { PoliticianFormData } from "@/components/contribute/PoliticianForm"; // Ensure this type is available

export async function denyPendingEditAction(editId: number) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated." };
  }
  
  const denialReason = "Denied by admin."; 

  const result = await denyEdit(editId, denialReason);

  if (result.success) {
    revalidatePath("/admin/moderation");
    return { success: true, message: "Edit denied successfully." };
  } else {
    return { success: false, error: result.error || "Failed to deny edit." };
  }
}

export async function approvePendingEditAction(editId: number) {
  const supabase = createSupabaseServerClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) {
    return { success: false, error: "Admin user not authenticated." };
  }
  const adminId = adminUser.id;

  const result = await approveEdit(editId); // approveEdit likely needs adminId
  
  if (result.success) {
    revalidatePath("/admin/moderation");

    if (result.entityType && result.entityId) {
      let specificPath = "";
      let listPath = "";

      switch (result.entityType) {
        case 'Politician':
          specificPath = \`/politicians/\${result.entityId}\`;
          listPath = '/politicians';
          break;
        case 'Party':
          specificPath = \`/parties/\${result.entityId}\`;
          listPath = '/parties';
          break;
      }

      if (specificPath) revalidatePath(specificPath);
      if (listPath) revalidatePath(listPath);
      revalidatePath("/"); 
    }
    
    return { success: true, message: result.message || "Edit approved successfully." };
  } else {
    return { success: false, error: result.error || "Failed to approve edit." };
  }
}

export async function approveNewPoliticianAction(editId: number): Promise<{ success: boolean; message?: string; error?: string; politicianId?: string }> {
  const supabase = createSupabaseServerClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) {
    return { success: false, error: "Admin user not authenticated." };
  }
  const adminId = adminUser.id;

  // 1. Fetch Pending Edit
  const { data: pendingEdit, error: fetchError } = await supabase
    .from('pending_edits')
    .select('id, proposed_data, entity_type, status, proposer_id')
    .eq('id', editId)
    .single();

  if (fetchError || !pendingEdit) {
    console.error(\`approveNewPoliticianAction: Error fetching pending edit \${editId}:\`, fetchError?.message);
    return { success: false, error: \`Pending edit with ID \${editId} not found or fetch error.\` };
  }

  if (pendingEdit.status !== 'Pending') {
    return { success: false, error: \`Edit \${editId} is not in 'Pending' status.\` };
  }
  if (pendingEdit.entity_type !== 'Politician') {
    return { success: false, error: \`Edit \${editId} is not for a Politician entity.\` };
  }
  if (!pendingEdit.proposer_id) {
    return { success: false, error: "Proposer ID missing from pending edit." };
  }
  
  const proposedData = pendingEdit.proposed_data as Partial<PoliticianFormData>;
  if (!proposedData || !proposedData.name) {
    return { success: false, error: "Proposed data is missing or invalid (e.g., name is required)." };
  }
  
  // Map PoliticianFormData from proposed_data to the structure for 'politicians' table.
  // Ensure data types are correct (e.g., parsing numbers, handling dates).
  // For simplicity, assuming direct mapping for now. Complex fields like contact_information 
  // and social_media_handles are objects and will be stored as JSONB.
  // photo_asset_id is expected to be a UUID string from the upload process.
  const politicianTableData = {
    name: proposedData.name,
    name_nepali: proposedData.name_nepali,
    dob: proposedData.dob || null, // Handle optional date
    gender: proposedData.gender,
    photo_asset_id: proposedData.photo_asset_id || null,
    biography: proposedData.biography,
    education_details: proposedData.education_details, // JSON string
    political_journey: proposedData.political_journey, // JSON string
    criminal_records: proposedData.criminal_records,   // JSON string
    asset_declarations: proposedData.asset_declarations, // JSON string
    contact_information: proposedData.contact_information || {}, // JSONB
    social_media_handles: proposedData.social_media_handles || {}, // JSONB
    // is_independent needs to be derived or set based on party info (not in current form)
    // province_id needs to be derived or set (not in current form)
    // fts_vector will be auto-updated by DB trigger if configured
  };

  // 2. Create Politician in 'politicians' table
  const { data: newPolitician, error: insertPoliticianError } = await supabase
    .from('politicians')
    .insert(politicianTableData)
    .select('id')
    .single();

  if (insertPoliticianError || !newPolitician) {
    console.error('Error inserting new politician:', insertPoliticianError?.message);
    return { success: false, error: \`Failed to create new politician: \${insertPoliticianError?.message}\` };
  }
  const newPoliticianId = String(newPolitician.id); // Ensure ID is string

  // 3. Update Pending Edit status
  const { error: updateEditError } = await supabase
    .from('pending_edits')
    .update({
      status: 'Approved',
      admin_feedback: \`Approved by admin \${adminId} on \${new Date().toLocaleDateString()}\`,
      updated_at: new Date().toISOString(),
      entity_id: newPoliticianId, // Link to the newly created politician
      moderator_id: adminId,
    })
    .eq('id', editId);

  if (updateEditError) {
    // Attempt to roll back politician creation or log inconsistency
    console.error(\`Error updating status for pending edit \${editId}:\`, updateEditError.message);
    return { success: false, error: \`New politician created (ID: \${newPoliticianId}), but failed to update pending edit status.\` };
  }

  // 4. Create Entity Revision
  const revisionData = {
    entity_type: 'Politician',
    entity_id: newPoliticianId,
    data: politicianTableData,
    submitter_id: pendingEdit.proposer_id,
    approver_id: adminId,
    edit_id: edit.id, // Link back to the original pending_edit
  };

  const { error: insertRevisionError } = await supabase
    .from('entity_revisions')
    .insert(revisionData);

  if (insertRevisionError) {
    console.warn(\`Error inserting entity revision for politician \${newPoliticianId}:\`, insertRevisionError.message);
    // Non-critical for the success message, but good to log
  }

  revalidatePath("/admin/moderation");
  revalidatePath("/politicians");
  revalidatePath(\`/politicians/\${newPoliticianId}\`);

  return { 
    success: true, 
    message: \`New politician (ID: \${newPoliticianId}) approved and created from contribution \${editId}.\`,
    politicianId: newPoliticianId
  };
}
