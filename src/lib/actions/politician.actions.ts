
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
    // Ensure proposed_data fields are correctly formatted for 'politicians' table.
    // Specifically, fields like criminal_records/asset_declarations should be strings
    // if they were stored as stringified JSON in pending_edits.proposed_data.
    const politicianDataForInsert: Record<string, any> = {};
    const rawProposedData = edit.proposed_data as Record<string, any>;

    for (const key in rawProposedData) {
        if (Object.prototype.hasOwnProperty.call(rawProposedData, key)) {
            const value = rawProposedData[key];
            if (key === 'criminal_records') {
                politicianDataForInsert['public_criminal_records'] = typeof value === 'string' ? value : JSON.stringify(value ?? null);
            } else if (key === 'asset_declarations') {
                politicianDataForInsert['asset_declarations'] = typeof value === 'string' ? value : JSON.stringify(value ?? null);
            } else if (key === 'education_details') {
                politicianDataForInsert['education'] = typeof value === 'string' ? value : JSON.stringify(value ?? null);
            } else if (key === 'biography') {
                politicianDataForInsert['bio'] = value;
            } else {
                politicianDataForInsert[key] = value;
            }
        }
    }
    delete politicianDataForInsert.id; // Remove ID if present in proposed_data


    const { data: newPoliticianEntry, error: insertPoliticianError } = await supabase
      .from('politicians')
      .insert(politicianDataForInsert as Tables<'politicians'>['Insert'])
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
        entity_id: newPoliticianId, // Storing as string, DB column is string|null
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
        entity_id: parseInt(newPoliticianId, 10), // entity_revisions.entity_id is number
        data: edit.proposed_data, // Store the original proposed_data from pending_edits
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

const JSON_STRING_FIELDS_IN_POLITICIANS_TABLE: Array<keyof Tables<'politicians'>['Row']> = [
  'public_criminal_records',
  'asset_declarations',
  'education',
  'political_journey',
];


export async function updatePoliticianDirectly(
  politicianId: string, // This is string from URL param, but politicians.id is number
  fieldName: keyof Tables<'politicians'>['Row'], 
  newValue: any,
  adminId: string,
  changeReason?: string
): Promise<DirectUpdateReturnType> {
  const supabase = createSupabaseServerClient();
  const numericPoliticianId = parseInt(politicianId, 10);
  if (isNaN(numericPoliticianId)) {
    return { success: false, error: "Invalid Politician ID format." };
  }

  try {
    let valueToStoreInPoliticiansTable = newValue;
    if (
      JSON_STRING_FIELDS_IN_POLITICIANS_TABLE.includes(fieldName) &&
      typeof newValue === 'object' &&
      newValue !== null
    ) {
      valueToStoreInPoliticiansTable = JSON.stringify(newValue);
    } else if (newValue === undefined) {
      valueToStoreInPoliticiansTable = null;
    }

    const updateObject = {
      [fieldName]: valueToStoreInPoliticiansTable,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedPolitician, error: updateError } = await supabase
      .from('politicians')
      .update(updateObject)
      .eq('id', numericPoliticianId) // Use numeric ID for comparison
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

    // For entity_revisions.data (JSONB), store the original newValue (or null if undefined)
    const revisionDataValueForField = newValue === undefined ? null : newValue;
    const revisionDataPayload = { [fieldName]: revisionDataValueForField };

    const revisionData = {
      entity_type: 'Politician' as const,
      entity_id: numericPoliticianId, // Use numeric ID
      data: revisionDataPayload, // Store the original structure for JSONB
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
    revalidatePath(`/politicians/${politicianId}`); // Path is string based on URL

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
  editId?: number | string; // pending_edits.id is number
}

// This action is for single-field edits (typically from EditModal by non-admins)
export async function submitPoliticianEdit(
  politicianId: string, // From URL, string
  fieldName: string, 
  newValue: any,
  changeReason: string,
  userId: string
): Promise<SubmitEditReturnType> {
  const supabase = createSupabaseServerClient();

  try {
    let finalValueToPropose = newValue;

    if (newValue === undefined) {
        finalValueToPropose = null;
    } else if ((fieldName === 'public_criminal_records' || fieldName === 'asset_declarations' || fieldName === 'education' || fieldName === 'political_journey' || fieldName === 'bio') && 
               (Array.isArray(newValue) || (typeof newValue === 'object' && newValue !== null))) {
        // If field is one of these complex types that are TEXT in `politicians` table,
        // and `newValue` is an array/object (from custom editors), stringify it.
        // This stringified version will be stored as the value for this key in proposed_data (JSONB).
        finalValueToPropose = JSON.stringify(newValue);
    }
    // For other simple fields (text, number, boolean from standard inputs), 
    // finalValueToPropose remains as newValue (or null if it was undefined).

    const proposedDataWrapper = { [fieldName]: finalValueToPropose };

    const pendingEditData = {
      entity_type: 'Politician' as const,
      entity_id: politicianId, // pending_edits.entity_id is string | null in schema types
      proposed_data: proposedDataWrapper, 
      change_reason: changeReason,
      proposer_id: userId,
      status: 'Pending' as const,
    };

    const { data, error } = await supabase
      .from('pending_edits')
      .insert(pendingEditData)
      .select('id') // pending_edits.id is number
      .single();

    if (error) {
      console.error('Error inserting single field pending edit:', error.message, error.details, error.hint);
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
  politicianId: string, // From URL, string
  formData: PoliticianHeaderFormData,
  userId: string,
  isAdmin: boolean,
  changeReasonInput?: string
): Promise<SubmitEditReturnType | DirectUpdateReturnType> {
  const supabase = createSupabaseServerClient();
  const numericPoliticianId = parseInt(politicianId, 10); // For DB operations on politicians.id

  if (isNaN(numericPoliticianId) && isAdmin) { // Non-admin path uses string politicianId for pending_edits
    return { success: false, error: "Invalid Politician ID for admin update." };
  }


  const changeReason = changeReasonInput || (isAdmin ? "Admin header update" : "User header update proposal");

  if (!isAdmin && (!changeReasonInput || changeReasonInput.trim() === "")) {
    return { success: false, error: "Change reason is required for non-admin users.", message: "Change reason is required." };
  }

  const dataForStorage: Record<string, any> = {};
  for (const key in formData) {
    if (Object.prototype.hasOwnProperty.call(formData, key)) {
      const typedKey = key as keyof PoliticianHeaderFormData;
      const value = formData[typedKey];
      dataForStorage[typedKey] = value === '' || value === undefined ? null : value;
    }
  }
  
  if (isAdmin) {
    const updateObjectForPoliticiansTable: Partial<Tables<'politicians'>['Row']> = {
      ...dataForStorage, // Already has nulls for empty/undefined
      updated_at: new Date().toISOString(),
    };
     // Remove keys that are not direct columns or if the value is null and DB default is better
    const finalUpdateObject = Object.fromEntries(
        Object.entries(updateObjectForPoliticiansTable).filter(([_, v]) => v !== undefined) // Keep nulls
    );


    console.log("[submitPoliticianHeaderEditAction] Admin attempting direct update. Update object for 'politicians' table:", JSON.stringify(finalUpdateObject, null, 2));

    const { data: updatedPolitician, error: updateError } = await supabase
      .from('politicians')
      .update(finalUpdateObject)
      .eq('id', numericPoliticianId)
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
        entity_id: numericPoliticianId,
        data: dataForStorage, // Store the processed form data (with nulls)
        submitter_id: userId,
        approver_id: userId,
        approved_at: new Date().toISOString(),
        change_reason: changeReason,
      });
    if (revisionError) console.warn("[submitPoliticianHeaderEditAction] Revision creation error for header update (admin):", revisionError.message);

    revalidatePath(`/politicians/${politicianId}`); // URL path uses string ID
    revalidatePath(`/politicians`);
    return { success: true, data: updatedPolitician, message: 'Politician header updated successfully.' };

  } else {
    // For non-admin, store in pending_edits
    const pendingEditData = {
      entity_type: 'Politician' as const,
      entity_id: politicianId, // pending_edits.entity_id is string | null
      proposed_data: dataForStorage, // Store processed form data (with nulls)
      change_reason: changeReason,
      proposer_id: userId,
      status: 'Pending' as const,
    };
    console.log("[submitPoliticianHeaderEditAction] Non-admin submitting pending edit. Pending edit data:", JSON.stringify(pendingEditData, null, 2));


    const { data, error } = await supabase
      .from('pending_edits')
      .insert(pendingEditData)
      .select('id') // pending_edits.id is number
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


export async function submitFullPoliticianUpdate(
  politicianId: string, // From URL, string
  formData: PoliticianFormData,
  userId: string
): Promise<SubmitEditReturnType> {
  const supabase = createSupabaseServerClient();

  try {
    const dataForProposedEdit: Record<string, any> = {};
    for (const key in formData) {
        if (Object.prototype.hasOwnProperty.call(formData, key)) {
            const typedKey = key as keyof PoliticianFormData;
            const value = formData[typedKey];

            if (value === undefined) {
                dataForProposedEdit[typedKey] = null; 
            } else if ((typedKey === 'criminal_records' || typedKey === 'asset_declarations' || typedKey === 'education_details' || typedKey === 'political_journey') &&
                       (Array.isArray(value) || (typeof value === 'object' && value !== null))) {
                // These fields, if complex types, are stringified for proposed_data,
                // because target columns in 'politicians' are TEXT (public_criminal_records, asset_declarations, education, political_journey)
                // Note: education_details from form maps to education in DB, biography to bio.
                const dbKey = typedKey === 'education_details' ? 'education' : (typedKey === 'biography' ? 'bio' : typedKey);
                dataForProposedEdit[dbKey] = JSON.stringify(value);
            } else if (typedKey === 'biography') {
                dataForProposedEdit['bio'] = value; // Map biography to bio
            }
            else {
                dataForProposedEdit[typedKey] = value;
            }
        }
    }
    // Ensure actual DB column names if they differ from PoliticianFormData keys beyond the specific mappings above
    if (dataForProposedEdit.hasOwnProperty('education_details') && !dataForProposedEdit.hasOwnProperty('education')) {
        dataForProposedEdit.education = dataForProposedEdit.education_details;
        delete dataForProposedEdit.education_details;
    }
     if (dataForProposedEdit.hasOwnProperty('biography') && !dataForProposedEdit.hasOwnProperty('bio')) {
        dataForProposedEdit.bio = dataForProposedEdit.biography;
        delete dataForProposedEdit.biography;
    }


    const pendingEditData = {
      entity_type: 'Politician' as const,
      entity_id: politicianId, // pending_edits.entity_id is string | null
      proposed_data: dataForProposedEdit,
      change_reason: "User submitted full profile update via edit page.",
      proposer_id: userId,
      status: 'Pending' as const,
    };

    const { data, error } = await supabase
      .from('pending_edits')
      .insert(pendingEditData)
      .select('id') // pending_edits.id is number
      .single();

    if (error) {
      console.error('Error inserting full profile pending edit:', error.message, error.details, error.hint);
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
  editId: number, // pending_edits.id is number
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
    

    