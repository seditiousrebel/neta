
// src/lib/actions/politician.actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { PoliticianFormData } from "@/components/contribute/PoliticianForm";
import type { Tables } from "@/types/supabase";

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
        edit_id: edit.id, // Link back to the original pending_edit
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

// Fields that store structured data as stringified JSON in the 'politicians' table's TEXT columns
const JSON_STRING_FIELDS_IN_POLITICIANS_TABLE: Array<keyof Tables<'politicians'>['Row']> = [
  'public_criminal_records',
  'asset_declarations',
  // 'education' and 'political_journey' are also TEXT but currently edited as strings (Markdown)
];


export async function updatePoliticianDirectly(
  politicianId: string,
  fieldName: keyof Tables<'politicians'>['Row'], // Use keyof for type safety
  newValue: any,
  adminId: string,
  changeReason?: string
): Promise<DirectUpdateReturnType> {
  const supabase = createSupabaseServerClient();

  try {
    let valueToStore = newValue;
    // If the field is one that expects stringified JSON and newValue is an object/array, stringify it.
    if (
      JSON_STRING_FIELDS_IN_POLITICIANS_TABLE.includes(fieldName) &&
      typeof newValue === 'object' &&
      newValue !== null
    ) {
      valueToStore = JSON.stringify(newValue);
    }


    const updateObject = {
      [fieldName]: valueToStore,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedPolitician, error: updateError } = await supabase
      .from('politicians')
      .update(updateObject)
      .eq('id', politicianId)
      .select()
      .single();

    if (updateError) {
      console.error(`Error updating politician ${politicianId} for field ${String(fieldName)}:`, updateError);
      return {
        success: false,
        error: updateError.message,
        message: `Failed to update politician data for field ${String(fieldName)}.`
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

    // For entity_revisions.data (which is JSON type), store the original newValue
    // as it can handle objects/arrays directly.
    const revisionDataValue = { [fieldName]: newValue };

    const revisionData = {
      entity_type: 'Politician',
      entity_id: politicianId,
      data: revisionDataValue,
      submitter_id: adminId,
      approver_id: adminId,
      approved_at: new Date().toISOString(),
      edit_id: null, // Direct admin edit, not tied to a pending_edit
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
      message: `Politician field '${String(fieldName)}' updated successfully by admin.`
    };

  } catch (e: any) {
    console.error(`Unexpected error in updatePoliticianDirectly for ${politicianId}, field ${String(fieldName)}:`, e);
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

// This action is for single-field edits (typically from EditModal by non-admins)
export async function submitPoliticianEdit(
  politicianId: string,
  fieldName: string, // Keep as string for flexibility, can be any field name
  newValue: any,
  changeReason: string,
  userId: string
): Promise<SubmitEditReturnType> {
  const supabase = createSupabaseServerClient();

  try {
    let proposedValue = newValue;
    if (
        (fieldName === 'public_criminal_records' || fieldName === 'asset_declarations') &&
        typeof newValue === 'object' && newValue !== null
    ) {
        proposedValue = JSON.stringify(newValue);
    }

    const proposedData = { [fieldName]: proposedValue };

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

export interface PoliticianHeaderFormData {
  name: string;
  name_nepali?: string | null;
  dob?: string | null;
  dob_bs?: string | null;
  gender?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  permanent_address?: string | null;
  current_address?: string | null;
  twitter_handle?: string | null;
  facebook_profile_url?: string | null;
}

export async function submitPoliticianHeaderEditAction(
  politicianId: string,
  formData: PoliticianHeaderFormData,
  userId: string,
  isAdmin: boolean,
  changeReasonInput?: string
): Promise<SubmitEditReturnType | DirectUpdateReturnType> {
  const supabase = createSupabaseServerClient();

  const changeReason = changeReasonInput || (isAdmin ? "Admin header update" : "User header update proposal");

  if (!isAdmin && (!changeReasonInput || changeReasonInput.trim() === "")) {
    return { success: false, error: "Change reason is required for non-admin users.", message: "Change reason is required." };
  }

  const processedFormData: { [key: string]: any } = {};
  for (const key in formData) {
    if (Object.prototype.hasOwnProperty.call(formData, key)) {
      const typedKey = key as keyof PoliticianHeaderFormData;
      processedFormData[typedKey] = formData[typedKey] === '' ? null : formData[typedKey];
    }
  }
  const updateDataForDb = Object.fromEntries(
    Object.entries(processedFormData).filter(([_, v]) => v !== null)
  );

  // Enhanced Logging for Debugging UUID issue
  console.log("[submitPoliticianHeaderEditAction] Admin:", isAdmin);
  console.log("[submitPoliticianHeaderEditAction] Politician ID:", politicianId);
  console.log("[submitPoliticianHeaderEditAction] User ID (for submitter/approver):", userId);
  console.log("[submitPoliticianHeaderEditAction] Raw FormData:", JSON.stringify(formData, null, 2));
  console.log("[submitPoliticianHeaderEditAction] Processed FormData (empty strings to null):", JSON.stringify(processedFormData, null, 2));
  console.log("[submitPoliticianHeaderEditAction] Data for DB Update (nulls filtered):", JSON.stringify(updateDataForDb, null, 2));
  console.log("[submitPoliticianHeaderEditAction] Change Reason:", changeReason);

  // Check for fields with the value "4" or short numeric strings
  for (const key in updateDataForDb) {
    if (Object.prototype.hasOwnProperty.call(updateDataForDb, key)) {
      const value = updateDataForDb[key];
      if (String(value) === "4") { // Check if the string representation is "4"
        console.warn(`[submitPoliticianHeaderEditAction] CRITICAL WARNING: Field '${key}' has the value "${value}". If the database column for '${key}' is of type UUID, this WILL cause the "invalid input syntax for type uuid" error. Please check your 'politicians' table schema and the corresponding type in src/types/supabase.ts.`);
      } else if (typeof value === 'string' && /^\d+$/.test(value) && value.length < 5) {
        console.warn(`[submitPoliticianHeaderEditAction] INFO: Field '${key}' has a short purely numeric value: "${value}". If the DB column for this field is UUID and this value is not "4", this might still be an issue, but the error message specifically mentioned "4".`);
      }
    }
  }


  if (isAdmin) {
    const updateObject: Partial<Tables<'politicians'>['Row']> = {
      ...updateDataForDb,
      updated_at: new Date().toISOString(),
    };

    console.log("[submitPoliticianHeaderEditAction] Admin attempting direct update. Update object for 'politicians' table:", JSON.stringify(updateObject, null, 2));

    const { data: updatedPolitician, error: updateError } = await supabase
      .from('politicians')
      .update(updateObject)
      .eq('id', politicianId)
      .select()
      .single();

    if (updateError) {
      console.error("[submitPoliticianHeaderEditAction] Error updating politician header (admin):", updateError.message, updateError.details, updateError.hint);
      return { success: false, error: updateError.message, message: 'Failed to update politician header.' };
    }
    if (!updatedPolitician) {
      return { success: false, error: 'Politician not found after update.', message: 'Failed to retrieve politician after update.' };
    }

    const { error: revisionError } = await supabase
      .from('entity_revisions')
      .insert({
        entity_type: 'Politician',
        entity_id: politicianId,
        data: processedFormData,
        submitter_id: userId,
        approver_id: userId,
        approved_at: new Date().toISOString(),
        change_reason: changeReason,
      });
    if (revisionError) console.warn("[submitPoliticianHeaderEditAction] Revision creation error for header update (admin):", revisionError.message);

    revalidatePath(`/politicians/${politicianId}`);
    revalidatePath(`/politicians`);
    return { success: true, data: updatedPolitician, message: 'Politician header updated successfully.' };

  } else {
    const pendingEditData = {
      entity_type: 'Politician',
      entity_id: politicianId,
      proposed_data: processedFormData,
      change_reason: changeReason,
      proposer_id: userId,
      status: 'Pending' as const,
    };
    console.log("[submitPoliticianHeaderEditAction] Non-admin submitting pending edit. Pending edit data:", JSON.stringify(pendingEditData, null, 2));


    const { data, error } = await supabase
      .from('pending_edits')
      .insert(pendingEditData)
      .select('id')
      .single();

    if (error) {
      console.error("[submitPoliticianHeaderEditAction] Error submitting header edit proposal (user):", error.message);
      return { success: false, error: error.message, message: 'Failed to submit header edit proposal.' };
    }
    if (!data || !data.id) {
        return { success: false, error: 'Failed to retrieve ID for pending edit.', message: 'Submission partially succeeded but ID is missing.' };
    }
    revalidatePath(`/politicians/${politicianId}`);
    return { success: true, editId: data.id, message: 'Header edit proposal submitted for review.' };
  }
}


// This action is for submitting a full profile update for an existing politician (from /politicians/[id]/edit page)
export async function submitFullPoliticianUpdate(
  politicianId: string,
  formData: PoliticianFormData,
  userId: string
): Promise<SubmitEditReturnType> {
  const supabase = createSupabaseServerClient();

  try {
    const proposedDataForPendingEdit: any = { ...formData };
    if (Array.isArray(formData.criminal_records)) {
        proposedDataForPendingEdit.criminal_records = JSON.stringify(formData.criminal_records);
    }
    if (Array.isArray(formData.asset_declarations)) {
        proposedDataForPendingEdit.asset_declarations = JSON.stringify(formData.asset_declarations);
    }

    const pendingEditData = {
      entity_type: 'Politician',
      entity_id: politicianId,
      proposed_data: proposedDataForPendingEdit,
      change_reason: "User submitted full profile update via edit page.",
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

    revalidatePath(`/politicians/${politicianId}`);

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
    
