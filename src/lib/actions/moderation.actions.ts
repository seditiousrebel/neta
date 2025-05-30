
"use server";

import { revalidatePath } from "next/cache";
import { denyEdit, approveEdit } from "@/lib/supabase/admin"; 
import { createSupabaseServerClient } from "../supabase/server";

export async function denyPendingEditAction(editId: number) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated." };
  }
  
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

  const result = await approveEdit(editId);
  
  if (result.success) {
    revalidatePath("/admin/moderation");

    if (result.entityType && result.entityId) {
      let specificPath = "";
      let listPath = "";

      switch (result.entityType) {
        case 'Politician':
          specificPath = `/politicians/${result.entityId}`;
          listPath = '/politicians';
          break;
        case 'Party':
          specificPath = `/parties/${result.entityId}`;
          listPath = '/parties';
          break;
        // Add more cases for other entity types as needed
        // e.g., case 'Promise': specificPath = `/promises/${result.entityId}`; listPath = '/promises'; break;
      }

      if (specificPath) {
        revalidatePath(specificPath);
        console.log(`Revalidated path: ${specificPath}`);
      }
      if (listPath) {
        revalidatePath(listPath);
        console.log(`Revalidated path: ${listPath}`);
      }
      // Optionally revalidate home page or general feed if applicable
      revalidatePath("/"); 
    }
    
    return { success: true, message: result.message || "Edit approved successfully." };
  } else {
    return { success: false, error: result.error || "Failed to approve edit." };
  }
}
    