
"use server";

import { revalidatePath } from "next/cache";
import { denyEdit, approveEdit } from "@/lib/supabase/admin"; // Import approveEdit
import { createSupabaseServerClient } from "../supabase/server";

export async function denyPendingEditAction(editId: number) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated." };
  }
  
  // For now, a generic denial reason. This can be expanded to take a reason from the UI.
  const denialReason = "Denied by admin."; 

  const result = await denyEdit(editId, denialReason);

  if (result.success) {
    revalidatePath("/admin/moderation");
    return { success: true, message: "Edit denied successfully." };
  } else {
    return { success: false, error: result.error || "Failed to deny edit." };
  }
}

export async function approvePendingEditAction(editId: number) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated." };
  }
  // Potentially add role check here if needed, though AdminGuard on layout should cover it.

  const result = await approveEdit(editId);
  
  if (result.success) {
    revalidatePath("/admin/moderation");
    // TODO: Consider revalidating specific entity paths if possible.
    // Example: If a politician was edited, revalidatePaths like `/politicians` and `/politicians/${entityId}`
    // This requires getting entityId and type from `result` or fetching the edit again.
    return { success: true, message: result.message || "Edit approved successfully." };
  } else {
    return { success: false, error: result.error || "Failed to approve edit." };
  }
}

    