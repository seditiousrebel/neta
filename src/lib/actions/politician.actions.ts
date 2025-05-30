// src/lib/actions/politician.actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
// Ensure PoliticianFormData is available if strong typing is desired for proposed_data.
// For now, proposed_data will be treated as `any` or `JSONValue` from Supabase types.
// import type { PoliticianFormData } from "@/components/contribute/PoliticianForm";

export async function approvePoliticianAction(
  editId: number, 
  adminId: string
): Promise<{ success: boolean; message: string; error?: string; politicianId?: string }> {
  const supabase = createSupabaseServerClient();
  let newPoliticianId: string | null = null;

  try {
    // 1. Get the pending edit and its proposer's ID
    const { data: edit, error: fetchError } = await supabase
      .from('pending_edits')
      .select('id, proposed_data, entity_type, status, proposer_id') // Ensure proposer_id is selected
      .eq('id', editId)
      .single();

    if (fetchError || !edit) {
      console.error(`approvePoliticianAction: Error fetching pending edit ${editId}:`, fetchError?.message);
      return { success: false, message: `Pending edit with ID ${editId} not found.` };
    }

    if (edit.entity_type !== 'Politician') {
      return { success: false, message: `Edit ${editId} is not for a Politician.` };
    }
    if (edit.status !== 'Pending') {
      return { success: false, message: `Edit ${editId} is not in 'Pending' status.` };
    }
    if (!edit.proposed_data) {
      return { success: false, message: `Edit ${editId} has no proposed data.` };
    }
    if (!edit.proposer_id) {
        console.error(`approvePoliticianAction: Proposer ID missing for edit ${editId}.`);
        return { success: false, message: `Proposer ID is missing for edit ${editId}. Cannot create revision.` };
    }

    // 2. Create the politician entry
    const politicianDataForInsert = { ...(edit.proposed_data as any) };
    delete politicianDataForInsert.id; 

    const { data: newPoliticianEntry, error: insertPoliticianError } = await supabase
      .from('politicians')
      .insert(politicianDataForInsert)
      .select('id') 
      .single();

    if (insertPoliticianError || !newPoliticianEntry || !newPoliticianEntry.id) {
      console.error(`approvePoliticianAction: Error inserting new politician from edit ${editId}:`, insertPoliticianError?.message);
      return { success: false, message: `Failed to create politician entry: ${insertPoliticianError?.message || 'No ID returned'}` };
    }
    newPoliticianId = newPoliticianEntry.id; 

    // 3. Update the pending_edit status
    const { error: updateEditError } = await supabase
      .from('pending_edits')
      .update({
        status: 'Approved',
        moderator_id: adminId,
        entity_id: newPoliticianId, 
        updated_at: new Date().toISOString(),
      })
      .eq('id', editId);

    if (updateEditError) {
      console.error(`approvePoliticianAction: Error updating pending edit ${editId} status:`, updateEditError.message);
      return { 
        success: false, 
        message: `Politician created (ID: ${newPoliticianId}), but failed to update edit status: ${updateEditError.message}`,
        politicianId: newPoliticianId 
      };
    }

    // 4. Create an entity revision
    const { error: revisionError } = await supabase
      .from('entity_revisions')
      .insert({
        entity_type: 'Politician',
        entity_id: newPoliticianId,
        data: edit.proposed_data, 
        submitter_id: edit.proposer_id, 
        approver_id: adminId,
        edit_id: edit.id, 
      });

    if (revisionError) {
      console.warn(`approvePoliticianAction: Error creating entity revision for politician ${newPoliticianId} from edit ${editId}:`, revisionError.message);
    }
    
    revalidatePath('/admin/moderation'); 
    revalidatePath(`/politicians`); 
    if (newPoliticianId) {
      revalidatePath(`/politicians/${newPoliticianId}`);
    }

    return { 
      success: true, 
      message: `Politician approved and created successfully. New Politician ID: ${newPoliticianId}.`, 
      politicianId: newPoliticianId 
    };

  } catch (e: any) {
    console.error(`approvePoliticianAction: Unexpected error for edit ${editId}:`, e.message, e.stack);
    return { success: false, message: `An unexpected error occurred: ${e.message}`, error: e.toString() };
  }
}

// Define ReturnType for submitPoliticianEdit
export interface SubmitEditReturnType {
  success: boolean;
  data?: any; // Consider using a more specific type if the structure of the inserted record is known
  error?: any; // Consider using a specific error type
  message?: string;
}

export async function submitPoliticianEdit(
  politicianId: string, // Assuming politicianId from profile page is string (UUID)
  fieldName: string,
  newValue: any,
  changeReason: string,
  userId: string // ID of the user proposing the edit
): Promise<SubmitEditReturnType> {
  const supabase = createSupabaseServerClient();

  try {
    const proposedData = { [fieldName]: newValue };

    // Construct the record for pending_edits
    const pendingEditData = {
      entity_type: 'Politician',
      entity_id: politicianId, // This should match the type of politicians.id
      proposed_data: proposedData,
      change_reason: changeReason,
      proposer_id: userId,
      status: 'Pending' as const, // Ensure this matches enum if defined in DB
      // created_at and updated_at are typically handled by DB defaults (e.g., now())
      // If not, you can set them:
      // created_at: new Date().toISOString(),
      // updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('pending_edits')
      .insert(pendingEditData)
      .select() // Optionally select the inserted record
      .single(); // Assuming you want to return the inserted record

    if (error) {
      console.error('Error inserting pending edit:', error);
      return { 
        success: false, 
        error: { message: error.message, details: error.details, hint: error.hint, code: error.code },
        message: 'Failed to submit edit proposal.' 
      };
    }

    // Revalidate relevant paths if needed, e.g., a user's dashboard of pending edits
    // revalidatePath(`/user/${userId}/pending-edits`); 
    // Or revalidate the politician's page if you display pending edits there (less common)
    // revalidatePath(`/politicians/${politicianId}`);


    return { success: true, data, message: 'Edit proposal submitted successfully.' };

  } catch (e: any) {
    console.error('Unexpected error in submitPoliticianEdit:', e);
    return { 
      success: false, 
      error: { message: e.message || 'An unexpected error occurred.' },
      message: 'An unexpected error occurred while submitting the edit proposal.'
    };
  }
}

export async function denyPoliticianAction(
  editId: number, 
  adminId: string, 
  reason?: string
): Promise<{ success: boolean; message: string; error?: string }> {
  const supabase = createSupabaseServerClient();

  try {
    const { data: edit, error: fetchError } = await supabase
      .from('pending_edits')
      .select('status, entity_type')
      .eq('id', editId)
      .single();

    if (fetchError || !edit) {
      console.error(`denyPoliticianAction: Error fetching pending edit ${editId}:`, fetchError?.message);
      return { success: false, message: `Pending edit with ID ${editId} not found.` };
    }
    if (edit.entity_type !== 'Politician') {
      return { success: false, message: `Edit ${editId} is not for a Politician.` };
    }
    if (edit.status !== 'Pending') {
      return { success: false, message: `Edit ${editId} is not in 'Pending' status and cannot be denied.` };
    }

    const { error: updateError } = await supabase
      .from('pending_edits')
      .update({
        status: 'Denied',
        moderator_id: adminId,
        admin_feedback: reason || 'Denied by moderator.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', editId);

    if (updateError) {
      console.error(`denyPoliticianAction: Error denying pending edit ${editId}:`, updateError.message);
      return { success: false, message: `Failed to deny edit: ${updateError.message}` };
    }

    revalidatePath('/admin/moderation');

    return { success: true, message: `Politician contribution request (Edit ID: ${editId}) has been denied.` };

  } catch (e: any) {
    console.error(`denyPoliticianAction: Unexpected error for edit ${editId}:`, e.message, e.stack);
    return { success: false, message: `An unexpected error occurred: ${e.message}`, error: e.toString() };
  }
}
