
// src/lib/actions/politician.actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { PoliticianFormData } from "@/components/contribute/PoliticianForm";

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
    newPoliticianId = String(newPoliticianEntry.id);

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

export interface DirectUpdateReturnType {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export async function updatePoliticianDirectly(
  politicianId: string,
  fieldName: string,
  newValue: any,
  adminId: string, 
  changeReason?: string 
): Promise<DirectUpdateReturnType> {
  const supabase = createSupabaseServerClient();

  try {
    const updateObject = { 
      [fieldName]: newValue, 
      updated_at: new Date().toISOString(),
    };

    const { data: updatedPolitician, error: updateError } = await supabase
      .from('politicians')
      .update(updateObject)
      .eq('id', politicianId)
      .select() 
      .single();

    if (updateError) {
      console.error(`Error updating politician ${politicianId}:`, updateError);
      return { 
        success: false, 
        error: updateError.message, 
        message: `Failed to update politician data for field ${fieldName}.` 
      };
    }

    if (!updatedPolitician) {
      console.error(`Politician ${politicianId} not found after update.`);
      return { 
        success: false, 
        error: 'Politician not found after update.', 
        message: 'Failed to retrieve politician data after update.' 
      };
    }

    const revisionData = {
      entity_type: 'Politician',
      entity_id: politicianId, 
      data: { [fieldName]: newValue }, 
      submitter_id: adminId, 
      approver_id: adminId,  
      approved_at: new Date().toISOString(),
      edit_id: null, 
      change_reason: changeReason || "Admin direct update.", 
    };

    const { error: revisionError } = await supabase
      .from('entity_revisions')
      .insert(revisionData);

    if (revisionError) {
      console.warn(`Error creating entity revision for politician ${politicianId} after direct admin update:`, revisionError);
    }

    revalidatePath(`/politicians`);
    revalidatePath(`/politicians/${politicianId}`);

    return { 
      success: true, 
      data: updatedPolitician, 
      message: `Politician field '${fieldName}' updated successfully by admin.` 
    };

  } catch (e: any) {
    console.error(`Unexpected error in updatePoliticianDirectly for ${politicianId}:`, e);
    return { 
      success: false, 
      error: e.message || 'An unexpected error occurred.', 
      message: 'An unexpected error occurred during the direct update.' 
    };
  }
}


export interface SubmitEditReturnType {
  success: boolean;
  message?: string;
  error?: string; 
  editId?: number | string; 
}

// This action is for single-field edits (typically from EditModal)
export async function submitPoliticianEdit(
  politicianId: string, 
  fieldName: string,
  newValue: any,
  changeReason: string,
  userId: string 
): Promise<SubmitEditReturnType> {
  const supabase = createSupabaseServerClient();

  try {
    const proposedData = { [fieldName]: newValue };

    const pendingEditData = {
      entity_type: 'Politician',
      entity_id: politicianId, 
      proposed_data: proposedData,
      change_reason: changeReason,
      proposer_id: userId,
      status: 'Pending' as const, 
    };

    const { data, error } = await supabase
      .from('pending_edits')
      .insert(pendingEditData)
      .select() 
      .single(); 

    if (error) {
      console.error('Error inserting single field pending edit:', error);
      return { 
        success: false, 
        error: error.message, 
        message: 'Failed to submit edit proposal.' 
      };
    }

    if (!data || !data.id) {
      console.error('Pending edit for single field created but ID not returned.');
      return {
        success: false,
        error: 'Failed to retrieve ID for the created pending edit.',
        message: 'Edit submission may have partially succeeded but ID is missing.'
      }
    }
    
    revalidatePath(`/politicians/${politicianId}`);


    return { 
      success: true, 
      editId: data.id, 
      message: 'Edit proposal submitted successfully.' 
    };

  } catch (e: any) {
    console.error('Unexpected error in submitPoliticianEdit:', e);
    return { 
      success: false, 
      error: e.message || 'An unexpected error occurred.',
      message: 'An unexpected error occurred while submitting the edit proposal.'
    };
  }
}

// New action for submitting a full profile update for an existing politician
export async function submitFullPoliticianUpdate(
  politicianId: string,
  formData: PoliticianFormData,
  userId: string
): Promise<SubmitEditReturnType> {
  const supabase = createSupabaseServerClient();

  try {
    const pendingEditData = {
      entity_type: 'Politician',
      entity_id: politicianId, // Link to the existing politician
      proposed_data: formData,   // The entire form data is the proposed update
      change_reason: "User submitted full profile update.", // Or a more specific reason if collected
      proposer_id: userId,
      status: 'Pending' as const,
    };

    const { data, error } = await supabase
      .from('pending_edits')
      .insert(pendingEditData)
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting full profile pending edit:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to submit profile update for review.',
      };
    }
    
    if (!data || !data.id) {
        console.error('Pending edit for full profile update created but ID not returned.');
        return {
            success: false,
            error: 'Failed to retrieve ID for the created pending edit.',
            message: 'Edit submission may have partially succeeded but ID is missing.'
        }
    }
    
    revalidatePath(`/politicians/${politicianId}`); // For any UI that might show pending changes

    return {
      success: true,
      editId: data.id,
      message: 'Profile update submitted successfully for review.',
    };

  } catch (e: any)
 {
    console.error('Unexpected error in submitFullPoliticianUpdate:', e);
    return {
      success: false,
      error: e.message || 'An unexpected error occurred.',
      message: 'An unexpected error occurred while submitting the profile update.',
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
    