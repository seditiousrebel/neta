
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
      console.error(\`approvePoliticianAction: Error fetching pending edit \${editId}:\`, fetchError?.message);
      return { success: false, message: \`Pending edit with ID \${editId} not found.\` };
    }

    if (edit.entity_type !== 'Politician') {
      return { success: false, message: \`Edit \${editId} is not for a Politician.\` };
    }
    if (edit.status !== 'Pending') {
      return { success: false, message: \`Edit \${editId} is not in 'Pending' status.\` };
    }
    if (!edit.proposed_data) {
      return { success: false, message: \`Edit \${editId} has no proposed data.\` };
    }
    if (!edit.proposer_id) {
        console.error(\`approvePoliticianAction: Proposer ID missing for edit \${editId}.\`);
        return { success: false, message: \`Proposer ID is missing for edit \${editId}. Cannot create revision.\` };
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
    delete politicianDataForInsert.id;


    const { data: newPoliticianEntry, error: insertPoliticianError } = await supabase
      .from('politicians')
      .insert(politicianDataForInsert as Tables<'politicians'>['Insert'])
      .select('id')
      .single();

    if (insertPoliticianError || !newPoliticianEntry || !newPoliticianEntry.id) {
      console.error(\`approvePoliticianAction: Error inserting new politician from edit \${editId}:\`, insertPoliticianError?.message);
      return { success: false, message: \`Failed to create politician entry: \${insertPoliticianError?.message || 'No ID returned'}\` };
    }
    newPoliticianId = String(newPoliticianEntry.id);

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
      console.error(\`approvePoliticianAction: Error updating pending edit \${editId} status:\`, updateEditError.message);
      return {
        success: false,
        message: \`Politician created (ID: \${newPoliticianId}), but failed to update edit status: \${updateEditError.message}\`,
        politicianId: newPoliticianId
      };
    }

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
      console.warn(\`approvePoliticianAction: Error creating entity revision for politician \${newPoliticianId} from edit \${editId}:\`, revisionError.message);
    }

    revalidatePath('/admin/moderation');
    revalidatePath(\`/politicians\`);
    if (newPoliticianId) {
      revalidatePath(\`/politicians/\${newPoliticianId}\`);
    }

    return {
      success: true,
      message: \`Politician approved and created successfully. New Politician ID: \${newPoliticianId}.\`,
      politicianId: newPoliticianId
    };

  } catch (e: any) {
    console.error(\`approvePoliticianAction: Unexpected error for edit \${editId}:\`, e.message, e.stack);
    return { success: false, message: \`An unexpected error occurred: \${e.message}\`, error: e.toString() };
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

  console.log(\`[updatePoliticianDirectly] Admin ID: \${adminId}, Politician ID: \${politicianId}, Field: \${String(fieldName)}\`);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(adminId)) {
    console.error("[updatePoliticianDirectly] CRITICAL: adminId parameter does not look like a UUID:", adminId);
    // return { success: false, error: "Internal error: Invalid admin identifier." };
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
      console.error(\`Error updating politician \${politicianId} for field \${String(fieldName)}:\`, updateError);
      return {
        success: false,
        error: updateError.message,
        message: \`Failed to update politician data for field \${String(fieldName)}.\`
      };
    }

    if (!updatedPolitician) {
      console.error(\`Politician \${politicianId} not found after update.\`);
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
      console.warn(\`Error creating entity revision for politician \${politicianId} after direct admin update:\`, revisionError);
    }

    revalidatePath(\`/politicians\`);
    revalidatePath(\`/politicians/\${politicianId}\`); // Path is string based on URL

    return {
      success: true,
      data: updatedPolitician,
      message: \`Politician field '\${String(fieldName)}' updated successfully by admin.\`
    };

  } catch (e: any) {
    console.error(\`Unexpected error in updatePoliticianDirectly for \${politicianId}, field \${String(fieldName)}:\`, e);
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
  console.log("[submitPoliticianEdit] Received userId:", userId, "politicianId:", politicianId, "fieldName:", fieldName);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.error("[submitPoliticianEdit] CRITICAL: userId parameter does not look like a UUID:", userId);
    // return { success: false, error: "Internal error: Invalid user identifier for edit submission." };
  }

  try {
    let finalValueToPropose = newValue === undefined ? null : newValue;

    // Specific handling for fields that are complex objects/arrays in the form
    // but should be stored as stringified JSON in proposed_data if their
    // target columns in `politicians` are TEXT.
    // This logic is based on the PoliticianFormData structure and how it maps to `politicians` table.
    if ((fieldName === 'public_criminal_records' || fieldName === 'asset_declarations' || fieldName === 'education' || fieldName === 'political_journey') &&
        (Array.isArray(finalValueToPropose) || (typeof finalValueToPropose === 'object' && finalValueToPropose !== null))) {
        finalValueToPropose = JSON.stringify(finalValueToPropose);
    } else if (fieldName === 'bio' && (typeof finalValueToPropose === 'object' && finalValueToPropose !== null)) {
        // Example: If 'bio' came from a rich text editor returning an object
        finalValueToPropose = JSON.stringify(finalValueToPropose);
    }
    // For simple fields (text, numbers directly from inputs), they are usually already strings or numbers.
    // `proposed_data` is JSONB, so it can handle these primitive types directly.

    const proposedDataWrapper = { [fieldName]: finalValueToPropose };

    const pendingEditData = {
      entity_type: 'Politician' as const,
      entity_id: politicianId, // pending_edits.entity_id is string | null in supabase.ts
      proposed_data: proposedDataWrapper,
      change_reason: changeReason,
      proposer_id: userId, // This must be a UUID
      status: 'Pending' as const,
    };
    console.log("[submitPoliticianEdit] Inserting into pending_edits:", JSON.stringify(pendingEditData, null, 2));


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

    revalidatePath(\`/politicians/\${politicianId}\`);

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
  userId: string, // This should be the auth user's UUID
  isAdmin: boolean,
  changeReasonInput?: string
): Promise<SubmitEditReturnType | DirectUpdateReturnType> {
  const supabase = createSupabaseServerClient();
  const numericPoliticianId = parseInt(politicianId, 10);

  // Diagnostic logging
  console.log("[submitPoliticianHeaderEditAction] Called with:");
  console.log("  politicianId (string from URL):", politicianId);
  console.log("  numericPoliticianId (parsed):", numericPoliticianId);
  console.log("  userId (auth user's UUID):", userId);
  console.log("  isAdmin:", isAdmin);
  console.log("  formData:", JSON.stringify(formData, null, 2));

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.error("[submitPoliticianHeaderEditAction] CRITICAL: userId parameter ('\${userId}') does not look like a UUID.");
    // This is a critical internal issue if userId is not a UUID.
    return { success: false, error: "Internal error: Invalid user identifier for action." };
  }

  if (isAdmin && isNaN(numericPoliticianId)) {
    console.error("[submitPoliticianHeaderEditAction] Admin path: politicianId ('\${politicianId}') is not a valid number.");
    return { success: false, error: "Invalid Politician ID for admin update." };
  }
  // For non-admin, politicianId ('string') is used for pending_edits.entity_id, which is string|null.

  const changeReason = changeReasonInput || (isAdmin ? "Admin header update" : "User header update proposal");

  if (!isAdmin && (!changeReasonInput || changeReasonInput.trim() === "")) {
    return { success: false, error: "Change reason is required for non-admin users.", message: "Change reason is required." };
  }

  // Prepare data, ensuring empty strings become null for DB consistency
  const dataForStorage: Record<string, any> = {};
  for (const key in formData) {
    if (Object.prototype.hasOwnProperty.call(formData, key)) {
      const typedKey = key as keyof PoliticianHeaderFormData;
      const value = formData[typedKey];
      dataForStorage[typedKey] = (value === '' || value === undefined) ? null : value;
    }
  }
  console.log("[submitPoliticianHeaderEditAction] dataForStorage (after nullifying empty strings):", JSON.stringify(dataForStorage, null, 2));


  if (isAdmin) {
    // ADMIN PATH: Direct update to 'politicians' and create 'entity_revisions'
    const updateObjectForPoliticiansTable: Partial<Tables<'politicians'>['Row']> = {
      ...dataForStorage, // Already has nulls for empty/undefined
      updated_at: new Date().toISOString(),
    };
    // Ensure no 'undefined' values are passed to Supabase client, only nulls or actual values.
    const finalUpdateObject = Object.fromEntries(
        Object.entries(updateObjectForPoliticiansTable).filter(([_, v]) => v !== undefined)
    );

    console.log("[submitPoliticianHeaderEditAction] Admin Path. Updating 'politicians' table with:", JSON.stringify(finalUpdateObject, null, 2));

    const { data: updatedPolitician, error: updateError } = await supabase
      .from('politicians')
      .update(finalUpdateObject)
      .eq('id', numericPoliticianId) // politicians.id is BIGINT
      .select()
      .single();

    if (updateError) {
      console.error("[submitPoliticianHeaderEditAction] Admin Path: Error updating 'politicians' table:", updateError.message, updateError.details, updateError.hint);
      return { success: false, error: updateError.message, message: 'Failed to update politician header.' };
    }
    if (!updatedPolitician) {
      return { success: false, error: 'Politician not found after update.', message: 'Failed to retrieve politician after update.' };
    }

    console.log("[submitPoliticianHeaderEditAction] Admin Path. Inserting into 'entity_revisions'. submitter_id/approver_id:", userId);
    const { error: revisionError } = await supabase
      .from('entity_revisions')
      .insert({
        entity_type: 'Politician',
        entity_id: numericPoliticianId, // entity_revisions.entity_id is number
        data: dataForStorage,
        submitter_id: userId, // This must be a UUID
        approver_id: userId,  // This must be a UUID
        approved_at: new Date().toISOString(),
        change_reason: changeReason,
        edit_id: null, // No pending edit for direct admin update
      });

    if (revisionError) {
        console.warn("[submitPoliticianHeaderEditAction] Admin Path: Revision creation warning for header update:", revisionError.message);
    }

    revalidatePath(\`/politicians/\${politicianId}\`);
    revalidatePath(\`/politicians\`);
    return { success: true, data: updatedPolitician, message: 'Politician header updated successfully.' };

  } else {
    // NON-ADMIN PATH: Insert into 'pending_edits'
    const pendingEditData = {
      entity_type: 'Politician' as const,
      entity_id: politicianId, // pending_edits.entity_id is string | null (stores "3")
      proposed_data: dataForStorage,
      change_reason: changeReason,
      proposer_id: userId, // This must be a UUID
      status: 'Pending' as const,
    };
    console.log("[submitPoliticianHeaderEditAction] Non-Admin Path. Inserting into 'pending_edits':", JSON.stringify(pendingEditData, null, 2));

    const { data, error } = await supabase
      .from('pending_edits')
      .insert(pendingEditData)
      .select('id') // pending_edits.id is number
      .single();

    if (error) {
      console.error("[submitPoliticianHeaderEditAction] Non-Admin Path: Error inserting into 'pending_edits':", error.message, error.details, error.hint);
      // THE ERROR "invalid input syntax for type uuid: "3"" LIKELY ORIGINATES HERE
      // IF pending_edits.entity_id IN THE DATABASE IS ACTUALLY TYPE UUID.
      return { success: false, error: error.message, message: 'Failed to submit header edit proposal.' };
    }
    if (!data || !data.id) {
        return { success: false, error: 'Failed to retrieve ID for pending edit.', message: 'Submission partially succeeded but ID is missing.' };
    }

    revalidatePath(\`/politicians/\${politicianId}\`);
    return { success: true, editId: data.id, message: 'Header edit proposal submitted for review.' };
  }
}


export async function submitFullPoliticianUpdate(
  politicianId: string, // From URL, string
  formData: PoliticianFormData,
  userId: string
): Promise<SubmitEditReturnType> {
  const supabase = createSupabaseServerClient();

  console.log("[submitFullPoliticianUpdate] Called with:");
  console.log("  politicianId:", politicianId);
  console.log("  userId:", userId);
  // console.log("  formData:", JSON.stringify(formData, null, 2)); // Can be very verbose

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    console.error("[submitFullPoliticianUpdate] CRITICAL: userId parameter ('\${userId}') does not look like a UUID.");
    return { success: false, error: "Internal error: Invalid user identifier for full update." };
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
        if (value === undefined) value = null; // Ensure undefined becomes null for JSONB

        let dbKey = key as string; // Default to key name
        let finalValue = value;

        // Map form field names to DB column names or handle specific transformations
        if (key === 'education_details') dbKey = 'education';
        else if (key === 'biography') dbKey = 'bio';
        else if (key === 'criminal_records') dbKey = 'public_criminal_records';
        // asset_declarations name matches
        // contact_information and social_media_handles match (will be stored as JSONB)

        // Stringify arrays/objects intended for TEXT columns or if they need to be JSON strings in JSONB
        if ((dbKey === 'public_criminal_records' || dbKey === 'asset_declarations' || dbKey === 'education' || dbKey === 'political_journey') &&
            (Array.isArray(value) || (typeof value === 'object' && value !== null))) {
            finalValue = JSON.stringify(value);
        } else if (key === 'contact_information' || key === 'social_media_handles') {
            // Ensure these are objects, even if empty, for JSONB consistency
            finalValue = (typeof value === 'object' && value !== null) ? value : {};
        }
        dataForProposedEdit[dbKey] = finalValue;
    });


    const pendingEditData = {
      entity_type: 'Politician' as const,
      entity_id: politicianId, // pending_edits.entity_id is string | null
      proposed_data: dataForProposedEdit,
      change_reason: "User submitted full profile update via edit page.",
      proposer_id: userId, // This must be a UUID
      status: 'Pending' as const,
    };
    console.log("[submitFullPoliticianUpdate] Inserting into pending_edits:", JSON.stringify(pendingEditData, null, 2));


    const { data, error } = await supabase
      .from('pending_edits')
      .insert(pendingEditData)
      .select('id') // pending_edits.id is number
      .single();

    if (error) {
      console.error('Error inserting full profile pending edit:', error.message, error.details, error.hint);
      // This is where the "invalid input syntax for type uuid: "3"" might occur if pending_edits.entity_id is UUID in DB
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

    revalidatePath(\`/politicians/\${politicianId}\`);

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
    };
  }
}


export async function denyPoliticianAction(
  editId: number, // pending_edits.id is number
  adminId: string,
  reason?: string
): Promise<{ success: boolean; message: string; error?: string }> {
  const supabase = createSupabaseServerClient();

  console.log("[denyPoliticianAction] Called with adminId:", adminId, "editId:", editId);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(adminId)) {
    console.error("[denyPoliticianAction] CRITICAL: adminId parameter ('\${adminId}') does not look like a UUID.");
    // return { success: false, message: "Internal error: Invalid admin identifier." };
  }

  try {
    const { data: edit, error: fetchError } = await supabase
      .from('pending_edits')
      .select('status, entity_type')
      .eq('id', editId)
      .single();

    if (fetchError || !edit) {
      console.error(\`denyPoliticianAction: Error fetching pending edit \${editId}:\`, fetchError?.message);
      return { success: false, message: \`Pending edit with ID \${editId} not found.\` };
    }
    if (edit.entity_type !== 'Politician') {
      return { success: false, message: \`Edit \${editId} is not for a Politician.\` };
    }
    if (edit.status !== 'Pending') {
      return { success: false, message: \`Edit \${editId} is not in 'Pending' status and cannot be denied.\` };
    }

    const { error: updateError } = await supabase
      .from('pending_edits')
      .update({
        status: 'Denied',
        moderator_id: adminId, // This must be a UUID
        admin_feedback: reason || 'Denied by moderator.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', editId);

    if (updateError) {
      console.error(\`denyPoliticianAction: Error denying pending edit \${editId}:\`, updateError.message);
      return { success: false, message: \`Failed to deny edit: \${updateError.message}\` };
    }

    revalidatePath('/admin/moderation');

    return { success: true, message: \`Politician contribution request (Edit ID: \${editId}) has been denied.\` };

  } catch (e: any) {
    console.error(\`denyPoliticianAction: Unexpected error for edit \${editId}:\`, e.message, e.stack);
    return { success: false, message: \`An unexpected error occurred: \${e.message}\`, error: e.toString() };
  }
}
