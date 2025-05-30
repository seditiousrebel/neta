
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "@/lib/utils"; // Simple error message utility

interface FollowActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

async function getUserId(): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function followEntityAction(entityId: number, entityType: string = 'Politician'): Promise<FollowActionResult> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }

  const supabase = createSupabaseServerClient();
  try {
    const { error } = await supabase
      .from('follows')
      .insert({
        user_id: userId,
        entity_id: entityId,
        entity_type: entityType,
      });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation (already followed)
        return { success: true, message: "Already following." };
      }
      console.error("Error following entity:", error);
      return { success: false, error: getErrorMessage(error) };
    }

    revalidatePath(`/politicians`); // Revalidate list page
    if (entityType === 'Politician') {
      revalidatePath(`/politicians/${entityId}`); // Revalidate detail page
    }
    // Add more revalidations if other entity types are followed

    return { success: true, message: "Successfully followed." };
  } catch (e) {
    return { success: false, error: getErrorMessage(e) };
  }
}

export async function unfollowEntityAction(entityId: number, entityType: string = 'Politician'): Promise<FollowActionResult> {
  const userId = await getUserId();
  if (!userId) {
    return { success: false, error: "User not authenticated." };
  }

  const supabase = createSupabaseServerClient();
  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('user_id', userId)
      .eq('entity_id', entityId)
      .eq('entity_type', entityType);

    if (error) {
      console.error("Error unfollowing entity:", error);
      return { success: false, error: getErrorMessage(error) };
    }
    
    revalidatePath(`/politicians`);
     if (entityType === 'Politician') {
      revalidatePath(`/politicians/${entityId}`);
    }

    return { success: true, message: "Successfully unfollowed." };
  } catch (e) {
    return { success: false, error: getErrorMessage(e) };
  }
}
