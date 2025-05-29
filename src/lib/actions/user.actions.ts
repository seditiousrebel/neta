
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  avatarUrl: z.string().url("Invalid avatar URL.").or(z.literal("")).optional(),
});

export async function updateUserProfile(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated." };
  }

  const rawFormData = {
    fullName: formData.get("fullName"),
    avatarUrl: formData.get("avatarUrl"),
  };

  const validation = UpdateProfileSchema.safeParse(rawFormData);

  if (!validation.success) {
    return { success: false, error: "Invalid input.", details: validation.error.flatten() };
  }

  const { fullName, avatarUrl } = validation.data;

  // Update auth.users user_metadata
  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: { 
      full_name: fullName,
      avatar_url: avatarUrl || null, // Store null if empty string
    },
  });

  if (authUpdateError) {
    console.error("Error updating auth user metadata:", authUpdateError);
    return { success: false, error: authUpdateError.message };
  }

  // Update public.users table
  // Assuming your public.users table has 'id' as primary key (matches auth.users.id)
  // and columns 'full_name', 'avatar_url'.
  const { error: publicUserUpdateError } = await supabase
    .from("users")
    .update({ 
      full_name: fullName,
      avatar_url: avatarUrl || null, // Store null if empty string
     })
    .eq("id", user.id);

  if (publicUserUpdateError) {
    console.error("Error updating public.users table:", publicUserUpdateError);
    // Potentially rollback auth.users update or handle inconsistency
    return { success: false, error: publicUserUpdateError.message };
  }

  revalidatePath("/profile"); // Revalidate the profile page to show updated data
  return { success: true, message: "Profile updated successfully." };
}
