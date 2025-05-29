
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters.").max(100),
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional().nullable(),
  newAvatarUrl: z.string().url("Invalid new avatar URL.").optional().nullable(),
});

export async function updateUserProfile(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated." };
  }

  const rawFormData = {
    fullName: formData.get("fullName"),
    bio: formData.get("bio") || null, 
    newAvatarUrl: formData.get("newAvatarUrl") || null,
  };

  const validation = UpdateProfileSchema.safeParse(rawFormData);

  if (!validation.success) {
    console.error("Validation errors:", validation.error.flatten());
    return { success: false, error: "Invalid input.", details: validation.error.flatten() };
  }

  const { fullName, bio, newAvatarUrl } = validation.data;
  
  // Updates for public.users table.
  const updatesForPublicUser: { full_name: string; bio?: string | null; avatar_url?: string | null; } = {
    full_name: fullName,
  };
  if (bio !== undefined) updatesForPublicUser.bio = bio; // Add bio if provided
  if (newAvatarUrl) updatesForPublicUser.avatar_url = newAvatarUrl; // Add newAvatarUrl if provided


  // Updates for auth.users user_metadata. Keep this in sync.
  const updatesForAuthUser: { full_name: string; avatar_url?: string | null; bio?: string | null } = {
    full_name: fullName,
  };
  if (newAvatarUrl) updatesForAuthUser.avatar_url = newAvatarUrl;
  if (bio !== undefined) updatesForAuthUser.bio = bio;


  // 1. Update public.users table
  const { error: publicUserUpdateError } = await supabase
    .from("users")
    .update(updatesForPublicUser)
    .eq("id", user.id);

  if (publicUserUpdateError) {
    console.error("Error updating public.users table:", publicUserUpdateError);
    return { success: false, error: `Failed to update profile details: ${publicUserUpdateError.message}` };
  }

  // 2. Update auth.users user_metadata
  // Only update if there are actual changes for auth metadata to avoid unnecessary updates
  if (Object.keys(updatesForAuthUser).length > 0) {
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: updatesForAuthUser, 
    });

    if (authUpdateError) {
      console.error("Error updating auth user metadata:", authUpdateError);
      // Note: public.users was updated, but auth.users failed. Decide on rollback strategy or accept inconsistency.
      // For now, we report success on public.users update but warn about auth metadata.
      // A more robust solution might involve a transaction if possible, or attempt to revert public.users update.
      return { success: false, error: `Profile details updated, but failed to update auth metadata: ${authUpdateError.message}` };
    }
  }

  revalidatePath("/profile"); 
  revalidatePath("/"); 
  return { success: true, message: "Profile updated successfully." };
}
