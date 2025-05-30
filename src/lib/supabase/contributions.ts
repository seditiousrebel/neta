// src/lib/supabase/contributions.ts
import { supabase } from './client';

export interface PoliticianData {
  name: string;
  name_nepali?: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other' | 'PreferNotToSay';
  photo_asset_id?: string | null; 
  biography?: string;
  education_details?: any[]; 
  political_journey?: any[]; 
  criminal_records?: any[]; 
  asset_declarations?: any[]; 
  contact_information?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  social_media_handles?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

export async function submitPolitician(data: PoliticianData, userId: string) {
  const { ...submissionData } = data;

  const result = await supabase.from('pending_edits').insert({
    entity_type: 'Politician',
    entity_id: null,
    proposed_data: {
      ...submissionData,
    },
    proposer_id: userId,
    status: 'Pending',
  });
  return result;
}
