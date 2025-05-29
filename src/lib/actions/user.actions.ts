
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
// Note: Direct file upload from server actions to Supabase storage is complex.
// The client component (ProfileForm) will handle the upload and pass the new avatar URL.

const UpdateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters.").max(100),
  bio: z.string().max(500, "Bio cannot exceed 500 characters.").optional().nullable(),
  // avatarUrl will be the new public URL from Supabase Storage, if changed
  newAvatarUrl: z.string().url("Invalid new avatar URL.").optional().nullable(),
  // oldAvatarPath: z.string().optional().nullable(), // Path of the old avatar for deletion
});

export async function updateUserProfile(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated." };
  }

  const rawFormData = {
    fullName: formData.get("fullName"),
    bio: formData.get("bio") || null, // Ensure null if empty
    newAvatarUrl: formData.get("newAvatarUrl") || null,
  };

  const validation = UpdateProfileSchema.safeParse(rawFormData);

  if (!validation.success) {
    console.error("Validation errors:", validation.error.flatten());
    return { success: false, error: "Invalid input.", details: validation.error.flatten() };
  }

  const { fullName, bio, newAvatarUrl } = validation.data;
  
  const updatesForPublicUser: { full_name: string; bio?: string | null; avatar_url?: string | null } = {
    full_name: fullName,
  };
  if (bio !== undefined) updatesForPublicUser.bio = bio; // Only include bio if it's part of the form
  if (newAvatarUrl) updatesForPublicUser.avatar_url = newAvatarUrl;

  const updatesForAuthUser: { full_name: string; avatar_url?: string | null } = {
    full_name: fullName,
  };
  if (newAvatarUrl) updatesForAuthUser.avatar_url = newAvatarUrl;


  // 1. Update public.users table
  const { error: publicUserUpdateError } = await supabase
    .from("users")
    .update(updatesForPublicUser)
    .eq("id", user.id);

  if (publicUserUpdateError) {
    console.error("Error updating public.users table:", publicUserUpdateError);
    return { success: false, error: `Failed to update profile: ${publicUserUpdateError.message}` };
  }

  // 2. Update auth.users user_metadata
  // Only update if there's something to update in metadata (name or avatar)
  if (Object.keys(updatesForAuthUser).length > 0) {
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: updatesForAuthUser,
    });

    if (authUpdateError) {
      console.error("Error updating auth user metadata:", authUpdateError);
      // Potentially rollback public.users update or handle inconsistency
      // For now, we'll report this error but the public.users table might be updated.
      return { success: false, error: `Failed to update auth metadata: ${authUpdateError.message}` };
    }
  }

  revalidatePath("/profile"); // Revalidate the profile page
  revalidatePath("/"); // Revalidate home if it shows user info in header
  return { success: true, message: "Profile updated successfully." };
}
