// src/lib/supabase/politicians.ts
import { createSupabaseBrowserClient } from '@/lib/supabase/client'; // Using client for potential client-side fetch
import type { PoliticianFormData } from '@/components/contribute/PoliticianForm'; // For return type

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

  // Ensure ID is a number if your DB column 'id' for politicians is numeric.
  // If it's UUID string, this conversion is not needed.
  const numericId = Number(politicianId);
  if (isNaN(numericId)) {
    console.error("getPoliticianById: Invalid politicianId format, expected numeric or convertible to numeric.");
    return null;
  }


  const { data, error } = await supabase
    .from('politicians')
    .select(\`
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
    \`) 
    .eq('id', numericId) // Use numericId here
    .maybeSingle(); // Use maybeSingle to return null if not found, instead of erroring

  if (error) {
    console.error(\`Error fetching politician with ID \${politicianId}:\`, error.message);
    return null;
  }

  if (!data) {
    // This is not an error, just means no politician found with that ID.
    // console.warn(\`No politician found with ID: \${politicianId}.\`);
    return null;
  }

  // The data from the DB should ideally match PoliticianFormData.
  // Supabase client usually handles JSONB parsing automatically.
  return data as Partial<PoliticianFormData>;
}
