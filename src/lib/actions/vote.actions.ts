// src/lib/actions/vote.actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/lib/utils";

interface VoteActionResult {
  success: boolean;
  message?: string;
  error?: string;
  newScore?: number; // Optional: could return the new aggregate score
}

async function getUserId(): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function recordVoteAction(
  entityId: number,
  entityType: string, // e.g., 'Politician', 'Party'
  voteDirection: 'up' | 'down' | 'none' // 'none' to undo vote
): Promise<VoteActionResult> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }

  const supabase = createSupabaseServerClient();

  try {
    // 1. Delete any existing vote by this user for this entity
    const { error: deleteError } = await supabase
      .from('entity_votes')
      .delete()
      .match({ user_id: userId, entity_id: entityId, entity_type: entityType });

    if (deleteError) {
      console.error("Error deleting existing vote:", deleteError);
      return { success: false, error: `Failed to clear previous vote: ${getErrorMessage(deleteError)}` };
    }

    // 2. If the new vote is not 'none' (undo), insert the new vote
    if (voteDirection !== 'none') {
      const dbVoteType = voteDirection === 'up' ? 1 : -1;
      const { error: insertError } = await supabase
        .from('entity_votes')
        .insert({
          user_id: userId,
          entity_id: entityId,
          entity_type: entityType,
          vote_type: dbVoteType,
        });

      if (insertError) {
        console.error("Error inserting new vote:", insertError);
        return { success: false, error: `Failed to record vote: ${getErrorMessage(insertError)}` };
      }
    }

    // Revalidate paths
    revalidatePath(`/politicians`); // Revalidate list page
    if (entityType === 'Politician') {
      revalidatePath(`/politicians/${entityId}`); // Revalidate detail page
    }
    // Add more specific revalidations if needed for other entity types

    return { success: true, message: "Vote recorded successfully." };
  } catch (e) {
    return { success: false, error: getErrorMessage(e) };
  }
}
