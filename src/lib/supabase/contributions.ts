// src/lib/supabase/contributions.ts
import { supabase } from './client';
import type { PoliticianFormData } from '@/components/contribute/PoliticianForm'; // Ensure PoliticianFormData is exported from the form

export async function submitNewPoliticianContribution(data: PoliticianFormData, userId: string) {
  // The PoliticianFormData is already well-structured for JSONB.
  // It might contain fields like `photo_asset_id` if photo upload is part of the form.
  const { ...proposedDataForDB } = data;

  const result = await supabase
    .from('pending_edits')
    .insert({
      entity_type: 'Politician', // Specific entity type for new politicians
      entity_id: null,           // Null for new entities
      proposed_data: proposedDataForDB, // The entire form data object
      proposer_id: userId,
      status: 'Pending',         // Initial status
      // created_at and updated_at will be handled by DB defaults
      // change_reason can be omitted for new submissions or have a default like "New politician submission"
      change_reason: "New politician profile submission.",
    })
    .select('id'); // Select only the ID of the created pending_edit record

  return result;
}
