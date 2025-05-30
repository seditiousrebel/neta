
// src/lib/supabase/politicians.ts
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { PoliticianFormData } from '@/components/contribute/PoliticianForm';

// Get the public Supabase client - for client-side usage if needed.
// For server-side, use createSupabaseServerClient().
const supabase = createSupabaseBrowserClient();

/**
 * Fetches a politician's current data by their ID.
 * This function is intended to be callable from client-side components if needed,
 * or can be adapted for server-side usage by passing a Supabase client.
 * 
 * @param politicianId The ID of the politician to fetch.
 * @returns A promise that resolves to the politician's data (as PoliticianFormData) or null if not found or error.
 */
export async function getPoliticianById(politicianId: string | number): Promise<Partial<PoliticianFormData> | null> {
  if (!politicianId) {
    console.error("getPoliticianById: politicianId is required.");
    return null;
  }

  const numericId = Number(politicianId);
  if (isNaN(numericId)) {
    console.error("getPoliticianById: Invalid politicianId format, expected numeric or convertible to numeric.");
    return null;
  }

  const { data, error } = await supabase
    .from('politicians')
    .select(`
      name,
      name_nepali,
      dob,
      gender,
      photo_asset_id,
      bio, 
      education, 
      political_journey,
      public_criminal_records,
      asset_declarations,
      contact_email,
      contact_phone,
      current_address,
      permanent_address,
      twitter_handle,
      facebook_profile_url
    `)
    .eq('id', numericId)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching politician with ID ${politicianId}:`, error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  // Transform flat DB data to nested PoliticianFormData structure
  const formData: Partial<PoliticianFormData> = {
    name: data.name,
    name_nepali: data.name_nepali || undefined, // Ensure undefined if null for optional fields
    dob: data.dob || undefined,
    gender: data.gender as PoliticianFormData['gender'] || undefined,
    photo_asset_id: data.photo_asset_id ? String(data.photo_asset_id) : null,
    
    biography: data.bio || undefined, // Map bio (DB) to biography (Form)
    education_details: data.education || undefined, // Map education (DB) to education_details (Form)
    political_journey: data.political_journey || undefined, // Map political_journey (DB) to political_journey (Form)

    contact_information: {
      email: data.contact_email || '',
      phone: data.contact_phone || '',
      address: data.current_address || data.permanent_address || '', 
    },
    social_media_handles: {
      twitter: data.twitter_handle ? `https://twitter.com/${data.twitter_handle.replace(/^@/, '')}` : '',
      facebook: data.facebook_profile_url || '',
      instagram: '', // No direct field in DB schema provided for instagram in politicians table
    },
    criminal_records: [],
    asset_declarations: [],
  };

  try {
    if (data.public_criminal_records && typeof data.public_criminal_records === 'string') {
      const parsedRecords = JSON.parse(data.public_criminal_records);
      formData.criminal_records = Array.isArray(parsedRecords) ? parsedRecords : [];
    } else if (Array.isArray(data.public_criminal_records)) {
      formData.criminal_records = data.public_criminal_records;
    }
  } catch (e) {
    console.error(`Error parsing public_criminal_records for politician ${politicianId}:`, e, "Raw data:", data.public_criminal_records);
  }

  try {
    if (data.asset_declarations && typeof data.asset_declarations === 'string') {
      const parsedAssets = JSON.parse(data.asset_declarations);
      formData.asset_declarations = Array.isArray(parsedAssets) ? parsedAssets : [];
    } else if (Array.isArray(data.asset_declarations)) {
      formData.asset_declarations = data.asset_declarations;
    }
  } catch (e) {
    console.error(`Error parsing asset_declarations for politician ${politicianId}:`, e, "Raw data:", data.asset_declarations);
  }

  return formData;
}
