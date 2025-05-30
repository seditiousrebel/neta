
// src/lib/actions/politician.actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { PoliticianFormData } from "@/components/contribute/PoliticianForm";
import type { Tables, Database } from "@/types/supabase"; // Added Database for type safety

export async function approvePoliticianAction(
  editId: number,
  adminId: string
): Promise<{ success: boolean; message: string; error?: string; politicianId?: string }> {
  const supabase = createSupabaseServerClient();
  let newPoliticianId: string | null = null;

  console.log("[approvePoliticianAction] Called with editId:", editId, "adminId:", adminId);

  try {
    const { data: edit, error: fetchError } = await supabase
      .from('pending_edits')
      .select('id, proposed_data, entity_type, status, proposer_id')
      .eq('id', editId)
      .single();

    if (fetchError || !edit) {
      console.error("approvePoliticianAction: Error fetching pending edit " + editId + ":", fetchError?.message);
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
    delete politicianDataForInsert.id; // Ensure 'id' from proposed_data (if any) is not sent for insert


    const { data: newPoliticianEntry, error: insertPoliticianError } = await supabase
      .from('politicians')
      .insert(politicianDataForInsert as Tables<'politicians'>['Insert'])
      .select('id')
      .single();

    if (insertPoliticianError || !newPoliticianEntry || !newPoliticianEntry.id) {
      console.error(`approvePoliticianAction: Error inserting new politician from edit ${editId}:`, insertPoliticianError?.message, insertPoliticianError?.details);
      return { success: false, message: `Failed to create politician entry: ${insertPoliticianError?.message || 'No ID returned'}` };
    }
    newPoliticianId = String(newPoliticianEntry.id);

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
      console.error(`approvePoliticianAction: Error updating pending edit ${editId} status:`, updateEditError.message, updateEditError?.details);
      return {
        success: false,
        message: `Politician created (ID: ${newPoliticianId}), but failed to update edit status: ${updateEditError.message}`,
        politicianId: newPoliticianId
      };
    }

    const { error: revisionError } = await supabase
      .from('entity_revisions')
      .insert({
        entity_type: 'Politician',
        entity_id: parseInt(newPoliticianId, 10), 
        data: edit.proposed_data, 
        submitter_id: edit.proposer_id,
        approver_id: adminId,
        approved_at: new Date().toISOString(), // Added approved_at for revisions table
        edit_id: edit.id,
        change_reason: (edit as any).change_reason || "Approved new politician submission", // Ensure change_reason is included
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
  details?: any; 
}

const JSON_STRING_FIELDS_IN_POLITICIANS_TABLE: Array<keyof Tables<'politicians'>['Row']> = [
  'public_criminal_records',
  'asset_declarations',
  'education',
  'political_journey',
];


export async function updatePoliticianDirectly(
  politicianId: string, 
  fieldName: keyof Tables<'politicians'>['Row'],
  newValue: any,
  adminId: string,
  changeReason?: string
): Promise<DirectUpdateReturnType> {
  const supabase = createSupabaseServerClient();
  const numericPoliticianId = parseInt(politicianId, 10);

  console.log("[updatePoliticianDirectly] Admin ID:", adminId, "Politician ID (numeric):", numericPoliticianId, "Field:", String(fieldName), "New Value:", newValue);

  if (isNaN(numericPoliticianId)) {
    console.error("[updatePoliticianDirectly] Invalid Politician ID provided:", politicianId);
    return { success: false, error: "Invalid Politician ID format." };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(adminId)) {
    console.warn("[updatePoliticianDirectly] Potential Issue: adminId parameter does not look like a UUID:", adminId);
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
      .eq('id', numericPoliticianId) 
      .select()
      .single();

    if (updateError) {
      console.error(`Error updating politician ${politicianId} for field ${String(fieldName)}:`, updateError.message, updateError.details);
      return {
        success: false,
        error: updateError.message,
        message: `Failed to update politician data for field ${String(fieldName)}.`,
        details: updateError.details,
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

    const revisionDataValueForField = newValue === undefined ? null : newValue;
    const revisionDataPayload = { [fieldName]: revisionDataValueForField };

    const revisionData = {
      entity_type: 'Politician' as const,
      entity_id: numericPoliticianId, 
      data: revisionDataPayload, 
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
      console.warn(`Error creating entity revision for politician ${politicianId} after direct admin update:`, revisionError.message, revisionError.details);
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
      message: 'An unexpected error occurred during the direct update.',
      details: e.toString(),
    };
  }
}


export interface SubmitEditReturnType {
  success: boolean;
  message?: string;
  error?: string;
  editId?: number | string;
  details?: any; 
}


export async function submitPoliticianEdit(
  politicianId: string, 
  fieldName: string,
  newValue: any,
  changeReason: string,
  userId: string
): Promise<SubmitEditReturnType> {
  const supabase = createSupabaseServerClient();
  console.log("[submitPoliticianEdit] Received userId:", userId, "politicianId:", politicianId, "fieldName:", fieldName, "newValue:", newValue);
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.warn("[submitPoliticianEdit] Potential Issue: userId parameter ('"+userId+"') does not look like a UUID.");
  }

  try {
    let finalValueToPropose = newValue === undefined ? null : newValue;

    if ((fieldName === 'public_criminal_records' || fieldName === 'asset_declarations' || fieldName === 'education' || fieldName === 'political_journey') &&
        (Array.isArray(finalValueToPropose) || (typeof finalValueToPropose === 'object' && finalValueToPropose !== null))) {
        finalValueToPropose = JSON.stringify(finalValueToPropose);
    } else if (fieldName === 'bio' && (typeof finalValueToPropose === 'object' && finalValueToPropose !== null)) {
        finalValueToPropose = JSON.stringify(finalValueToPropose);
    } else if (typeof finalValueToPropose === 'object' && finalValueToPropose !== null) {
        // Catch-all for other potential object values meant for JSONB, ensure they are stringified
        finalValueToPropose = JSON.stringify(finalValueToPropose);
    }
    
    const proposedDataWrapper = { [fieldName]: finalValueToPropose };

    const pendingEditData: Tables<'pending_edits'>['Insert'] = {
      entity_type: 'Politician',
      entity_id: String(politicianId), // Ensure politicianId is explicitly string for pending_edits.entity_id
      proposed_data: proposedDataWrapper,
      change_reason: changeReason,
      proposer_id: userId, 
      status: 'Pending',
    };
    console.log("[submitPoliticianEdit] Inserting into pending_edits:", JSON.stringify(pendingEditData, null, 2));


    const { data, error } = await supabase
      .from('pending_edits')
      .insert(pendingEditData)
      .select('id') 
      .single();

    if (error) {
      console.error('Error inserting single field pending edit:', error.message, error.details, error.hint);
      return {
        success: false,
        error: error.message,
        message: 'Failed to submit edit proposal.',
        details: { message: error.message, details: error.details, hint: error.hint }
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
      message: 'An unexpected error occurred while submitting the edit proposal.',
      details: e.toString()
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
  const numericPoliticianId = parseInt(politicianId, 10);

  console.log("[submitPoliticianHeaderEditAction] Called with politicianId(string):", politicianId, "userId:", userId, "isAdmin:", isAdmin, "numericPoliticianId:", numericPoliticianId);

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.warn("[submitPoliticianHeaderEditAction] Potential Issue: userId parameter ('"+userId+"') does not look like a UUID.");
  }

  if (isNaN(numericPoliticianId)) {
    console.error("[submitPoliticianHeaderEditAction] politicianId ('"+politicianId+"') is not a valid number after parseInt.");
    return { success: false, error: "Invalid Politician ID." };
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
      dataForStorage[typedKey] = (value === '' || value === undefined) ? null : value;
    }
  }
  console.log("[submitPoliticianHeaderEditAction] dataForStorage (payload for DB/pending_edits):", JSON.stringify(dataForStorage, null, 2));


  if (isAdmin) {
    const updateObjectForPoliticiansTable: Partial<Tables<'politicians'>['Row']> = {
      ...(dataForStorage as Partial<Tables<'politicians'>['Row']>), 
      updated_at: new Date().toISOString(),
    };
    
    const finalUpdateObject = Object.fromEntries(
        Object.entries(updateObjectForPoliticiansTable).filter(([_, v]) => v !== undefined)
    );

    console.log("[submitPoliticianHeaderEditAction] Admin Path. Updating 'politicians' table with:", JSON.stringify(finalUpdateObject, null, 2));

    const { data: updatedPolitician, error: updateError } = await supabase
      .from('politicians')
      .update(finalUpdateObject)
      .eq('id', numericPoliticianId) 
      .select()
      .single();

    if (updateError) {
      console.error("[submitPoliticianHeaderEditAction] Admin Path: Error updating 'politicians' table:", updateError.message, updateError.details, updateError.hint);
      return { success: false, error: updateError.message, message: 'Failed to update politician header.', details: updateError.details };
    }
    if (!updatedPolitician) {
      return { success: false, error: 'Politician not found after update.', message: 'Failed to retrieve politician after update.' };
    }

    console.log("[submitPoliticianHeaderEditAction] Admin Path. Inserting into 'entity_revisions'. submitter_id/approver_id:", userId);
    const { error: revisionError } = await supabase
      .from('entity_revisions')
      .insert({
        entity_type: 'Politician',
        entity_id: numericPoliticianId, 
        data: dataForStorage, // This is the JSONB field
        submitter_id: userId, 
        approver_id: userId,  
        approved_at: new Date().toISOString(),
        change_reason: changeReason,
        edit_id: null, 
      });

    if (revisionError) {
        console.warn("[submitPoliticianHeaderEditAction] Admin Path: Revision creation warning for header update:", revisionError.message, revisionError.details);
    }

    revalidatePath(`/politicians/${politicianId}`);
    revalidatePath(`/politicians`);
    return { success: true, data: updatedPolitician, message: 'Politician header updated successfully.' };

  } else {
    // NON-ADMIN PATH: Insert into 'pending_edits'
    const pendingEditData: Tables<'pending_edits'>['Insert'] = {
      entity_type: 'Politician',
      entity_id: String(politicianId), // Ensure entity_id is a string for pending_edits
      proposed_data: dataForStorage, // This is the JSONB field
      change_reason: changeReason,
      proposer_id: userId, 
      status: 'Pending',
    };
    console.log("[submitPoliticianHeaderEditAction] Non-Admin Path. Payload for 'pending_edits':", JSON.stringify(pendingEditData, null, 2));

    const { data, error } = await supabase
      .from('pending_edits')
      .insert(pendingEditData)
      .select('id') 
      .single();

    if (error) {
      console.error("[submitPoliticianHeaderEditAction] Non-Admin Path: Error inserting into 'pending_edits':", error.message, error.details, error.hint);
      return { success: false, error: error.message, message: 'Failed to submit edit proposal.', details: { message: error.message, details: error.details, hint: error.hint } };
    }
    if (!data || !data.id) {
        return { success: false, error: 'Failed to retrieve ID for pending edit.', message: 'Submission partially succeeded but ID is missing.' };
    }

    revalidatePath(`/politicians/${politicianId}`); // Revalidate the specific politician's page
    return { success: true, editId: data.id, message: 'Header edit proposal submitted for review.' };
  }
}


export async function submitFullPoliticianUpdate(
  politicianId: string, 
  formData: PoliticianFormData,
  userId: string
): Promise<SubmitEditReturnType> {
  const supabase = createSupabaseServerClient();

  console.log("[submitFullPoliticianUpdate] Called with politicianId:", politicianId, "userId:", userId);

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.warn("[submitFullPoliticianUpdate] Potential Issue: userId parameter ('"+userId+"') does not look like a UUID.");
  }

  try {
    const dataForProposedEdit: Record<string, any> = {};
    const allFormKeys: (keyof PoliticianFormData)[] = [
        'name', 'name_nepali', 'dob', 'dob_bs', 'gender', 'photo_asset_id',
        'biography', 'education_details', 'political_journey',
        'criminal_records', 'asset_declarations',
        'contact_information', 'social_media_handles'
    ];

    allFormKeys.forEach(key => {
        let value = formData[key];
        // Convert undefined to null for JSONB compatibility and DB storage.
        if (value === undefined) value = null; 

        let dbKey = key as string; 
        let finalValue = value;
        
        // Mapping form keys to DB column names if they differ
        if (key === 'education_details') dbKey = 'education';
        else if (key === 'biography') dbKey = 'bio';
        else if (key === 'criminal_records') dbKey = 'public_criminal_records';
        
        // Stringify arrays/objects intended for TEXT or JSONB columns that expect stringified JSON
        if ((dbKey === 'public_criminal_records' || dbKey === 'asset_declarations' || dbKey === 'education' || dbKey === 'political_journey') &&
            (Array.isArray(value) || (typeof value === 'object' && value !== null))) {
            finalValue = JSON.stringify(value);
        } else if ((key === 'contact_information' || key === 'social_media_handles') && (typeof value === 'object' && value !== null)) {
             // These are typically JSONB in 'politicians' but might be part of 'proposed_data'
            finalValue = value; // Keep as object for proposed_data JSONB
        }
        dataForProposedEdit[dbKey] = finalValue;
    });


    const pendingEditData: Tables<'pending_edits'>['Insert'] = {
      entity_type: 'Politician',
      entity_id: String(politicianId), // Ensure politicianId is explicitly string
      proposed_data: dataForProposedEdit, // This is JSONB
      change_reason: "User submitted full profile update via edit page.",
      proposer_id: userId, 
      status: 'Pending',
    };
    console.log("[submitFullPoliticianUpdate] Inserting into pending_edits:", JSON.stringify(pendingEditData, null, 2));


    const { data, error } = await supabase
      .from('pending_edits')
      .insert(pendingEditData)
      .select('id') 
      .single();

    if (error) {
      console.error('Error inserting full profile pending edit:', error.message, error.details, error.hint);
      return {
        success: false,
        error: error.message,
        message: 'Failed to submit profile update for review.',
        details: { message: error.message, details: error.details, hint: error.hint }
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

  } catch (e: any) {
    console.error('Unexpected error in submitFullPoliticianUpdate:', e);
    return {
      success: false,
      error: e.message || 'An unexpected error occurred.',
      message: 'An unexpected error occurred while submitting the profile update.',
      details: e.toString()
    };
  }
}


export async function denyPoliticianAction(
  editId: number, 
  adminId: string,
  reason?: string
): Promise<{ success: boolean; message: string; error?: string }> {
  const supabase = createSupabaseServerClient();

  console.log("[denyPoliticianAction] Called with adminId:", adminId, "editId:", editId);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(adminId)) {
    console.warn("[denyPoliticianAction] Potential Issue: adminId parameter ('"+adminId+"') does not look like a UUID.");
  }

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
