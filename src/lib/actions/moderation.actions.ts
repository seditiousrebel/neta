
"use server";

import { revalidatePath } from "next/cache";
import { denyEdit, approveEdit } from "@/lib/supabase/admin"; 
import { createSupabaseServerClient } from "../supabase/server";

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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated." };
  }

  const result = await approveEdit(editId);
  
  if (result.success) {
    revalidatePath("/admin/moderation");

    if (result.entityType && result.entityId) {
      let specificPath = "";
      let listPath = "";

      switch (result.entityType) {
        case 'Politician':
          specificPath = `/politicians/${result.entityId}`;
          listPath = '/politicians';
          break;
        case 'Party':
          specificPath = `/parties/${result.entityId}`;
          listPath = '/parties';
          break;
        // Add more cases for other entity types as needed
        // e.g., case 'Promise': specificPath = `/promises/${result.entityId}`; listPath = '/promises'; break;
      }

      if (specificPath) {
        revalidatePath(specificPath);
        console.log(`Revalidated path: ${specificPath}`);
      }
      if (listPath) {
        revalidatePath(listPath);
        console.log(`Revalidated path: ${listPath}`);
      }
      // Optionally revalidate home page or general feed if applicable
      revalidatePath("/"); 
    }
    
    return { success: true, message: result.message || "Edit approved successfully." };
  } else {
    return { success: false, error: result.error || "Failed to approve edit." };
  }
}

// New action to approve a new politician
export async function approveNewPoliticianAction(editId: number) {
  const supabase = createSupabaseServerClient();
  const { data: { user: adminUser } } = await supabase.auth.getUser();

  if (!adminUser) {
    return { success: false, error: "Admin user not authenticated." };
  }
  const adminId = adminUser.id;

  // 1. Fetch Pending Edit
  const { data: pendingEdit, error: fetchError } = await supabase
    .from('pending_edits')
    .select('*')
    .eq('id', editId)
    .single();

  if (fetchError || !pendingEdit) {
    console.error(`Error fetching pending edit ${editId}:`, fetchError?.message);
    return { success: false, error: `Pending edit with ID ${editId} not found or fetch error.` };
  }

  if (pendingEdit.status !== 'Pending') {
    return { success: false, error: `Edit ${editId} is not in 'Pending' status.` };
  }

  if (pendingEdit.entity_type !== 'Politician') {
    return { success: false, error: `Edit ${editId} is not for a Politician entity.` };
  }

  // This action is specifically for new politicians, so entity_id should ideally be null.
  // However, the generic approveEdit in supabase/admin.ts handles both new and existing.
  // For this specific action, we are creating a new politician.
  // If pendingEdit.entity_id is not null, it implies an update to an existing record,
  // which should ideally be handled by approvePendingEditAction or a more specific update action.
  // For now, we proceed assuming this action is correctly called for new entries.

  const proposedData = pendingEdit.proposed_data as Partial<PoliticianData>;

  // 2. Validate Proposed Data (Basic validation - ensure essential fields if necessary)
  // For example, ensure 'name' is present, as it's usually a required field.
  if (!proposedData.name) {
    return { success: false, error: "Proposed data is missing the required 'name' field." };
  }
  
  // Map PoliticianData to the expected structure for the 'politicians' table.
  // Assuming PoliticianData is already closely aligned with the table structure.
  // Fields like contact_information and social_media_handles are objects and will be stored as JSONB.
  const politicianTableData = {
    name: proposedData.name,
    name_nepali: proposedData.name_nepali,
    dob: proposedData.dob, // Ensure this is in 'YYYY-MM-DD' format if DB expects date
    gender: proposedData.gender,
    photo_asset_id: proposedData.photo_asset_id,
    biography: proposedData.biography,
    education_details: proposedData.education_details, // Stored as JSONB
    political_journey: proposedData.political_journey, // Stored as JSONB
    criminal_records: proposedData.criminal_records,   // Stored as JSONB
    asset_declarations: proposedData.asset_declarations, // Stored as JSONB
    contact_information: proposedData.contact_information, // Stored as JSONB
    social_media_handles: proposedData.social_media_handles, // Stored as JSONB
    // Any other fields that are part of the 'politicians' table and are in PoliticianData
    // Ensure to exclude any temporary fields from PoliticianData not meant for the DB table.
  };

  // 3. Create Politician
  const { data: newPolitician, error: insertPoliticianError } = await supabase
    .from('politicians')
    .insert(politicianTableData)
    .select('id') // Select the ID of the newly created politician
    .single();

  if (insertPoliticianError || !newPolitician) {
    console.error('Error inserting new politician:', insertPoliticianError?.message);
    return { success: false, error: `Failed to create new politician: ${insertPoliticianError?.message}` };
  }
  const newPoliticianId = newPolitician.id;

  // 4. Update Pending Edit
  const { error: updateEditError } = await supabase
    .from('pending_edits')
    .update({
      status: 'Approved',
      admin_feedback: `Approved by admin ${adminId} on ${new Date().toLocaleDateString()}`,
      updated_at: new Date().toISOString(),
      entity_id: newPoliticianId, // Link to the newly created politician
      moderator_id: adminId,
    })
    .eq('id', editId);

  if (updateEditError) {
    console.error(`Error updating status for pending edit ${editId}:`, updateEditError.message);
    // At this point, a politician record was created. This is a partial failure.
    // Ideally, this whole process should be a transaction.
    // For now, return error, but be aware of potential inconsistency.
    return { success: false, error: `New politician created (ID: ${newPoliticianId}), but failed to update pending edit status: ${updateEditError.message}` };
  }

  // 5. Create Entity Revision
  // Assuming 'entity_revisions' table structure: entity_type, entity_id, data, submitter_id, approver_id, created_at
  const revisionData = {
    entity_type: 'Politician',
    entity_id: newPoliticianId,
    data: politicianTableData, // Store the approved data
    submitter_id: pendingEdit.proposer_id,
    approver_id: adminId,
    created_at: new Date().toISOString(), 
    // reason: 'Initial creation via pending edit approval' // Optional: if you have a reason field
  };

  const { error: insertRevisionError } = await supabase
    .from('entity_revisions')
    .insert(revisionData);

  if (insertRevisionError) {
    console.error(`Error inserting entity revision for politician ${newPoliticianId}:`, insertRevisionError.message);
    // This is also a partial failure. Politician created, edit approved, but revision failed.
    return { success: false, error: `Politician approved and edit status updated, but failed to create entity revision: ${insertRevisionError.message}` };
  }

  // Placeholders for future functionality
  // TODO: Award points to proposer (pendingEdit.proposer_id)
  // TODO: Notify user (pendingEdit.proposer_id) that their submission was approved

  // 6. Revalidation
  revalidatePath("/admin/moderation");
  revalidatePath("/politicians"); // List page
  revalidatePath(`/politicians/${newPoliticianId}`); // Detail page of the new politician

  return { 
    success: true, 
    message: `New politician (ID: ${newPoliticianId}) approved and created successfully from edit ${editId}.` 
  };
}