// src/lib/supabase/politicians.ts
import { createSupabaseClient } from '@/lib/supabase/client'; // Using client for potential client-side fetch
import type { PoliticianFormData } from '@/components/contribute/PoliticianForm'; // For return type

// Get the public Supabase client
const supabase = createSupabaseClient();

/**
 * Fetches a politician's current data by their ID.
 * This function is intended to be callable from client-side components if needed,
 * or can be adapted for server-side usage.
 * 
 * @param politicianId The ID of the politician to fetch.
 * @returns A promise that resolves to the politician's data (as PoliticianFormData) or null if not found or error.
 */
export async function getPoliticianById(politicianId: string | number): Promise<Partial<PoliticianFormData> | null> {
  if (!politicianId) {
    console.error("getPoliticianById: politicianId is required.");
    return null;
  }

  const { data, error } = await supabase
    .from('politicians') // Ensure this is your actual table name
    .select(`
      name,
      name_nepali,
      dob,
      gender,
      photo_asset_id,
      biography,
      education_details,
      political_journey,
      criminal_records,
      asset_declarations,
      contact_information,
      social_media_handles
    `) // Select fields that align with PoliticianFormData
    .eq('id', politicianId)
    .single();

  if (error) {
    console.error(`Error fetching politician with ID ${politicianId}:`, error.message);
    return null;
  }

  if (!data) {
    console.warn(`No politician found with ID ${politicianId}.`);
    return null;
  }

  // The data from the DB should ideally match PoliticianFormData.
  // If there are discrepancies (e.g. DB stores JSON as strings that need parsing for `any[]` types),
  // further transformation might be needed here. For now, assume direct compatibility.
  // If education_details etc. are stored as JSON strings, they might need JSON.parse.
  // However, Supabase client usually handles JSONB parsing automatically.
  return data as Partial<PoliticianFormData>;
}
