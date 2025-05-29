
"use client"; // Can be used client-side for direct uploads

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

const AVATAR_BUCKET = 'avatars';

/**
 * Uploads an avatar image to Supabase Storage.
 * @param supabaseClient The Supabase client instance.
 * @param userId The ID of the user.
 * @param file The avatar file to upload.
 * @returns The public URL of the uploaded avatar.
 * @throws If the upload fails.
 */
export async function uploadAvatar(
  supabaseClient: SupabaseClient,
  userId: string,
  file: File
): Promise<{ path: string; publicUrl: string }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`; // Store in a user-specific folder

  const { data, error } = await supabaseClient.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600', // Cache for 1 hour
      upsert: true, // Overwrite if file with same name exists (useful if not using unique names)
    });

  if (error) {
    console.error('Error uploading avatar:', error);
    throw new Error(`Avatar upload failed: ${error.message}`);
  }

  if (!data?.path) {
     console.error('Error uploading avatar: No path returned');
    throw new Error('Avatar upload failed: No path returned from storage.');
  }

  const { data: urlData } = supabaseClient.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    console.error('Error getting public URL for avatar:', data.path);
    // Clean up uploaded file if public URL fails? Maybe not, could be a temp issue.
    throw new Error('Failed to get public URL for avatar.');
  }
  
  return { path: data.path, publicUrl: urlData.publicUrl };
}

/**
 * Retrieves the public URL for a given avatar path.
 * Note: This is often not needed if you store the full public URL directly.
 * @param supabaseClient The Supabase client instance.
 * @param path The path to the avatar in Supabase Storage.
 * @returns The public URL of the avatar.
 */
export function getAvatarUrl(
  supabaseClient: SupabaseClient,
  path: string
): string {
  const { data } = supabaseClient.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(path);
  return data?.publicUrl || '';
}

/**
 * Deletes an avatar from Supabase Storage.
 * @param supabaseClient The Supabase client instance.
 * @param avatarPath The path of the avatar file in storage (e.g., "user_id/avatar.png").
 * @returns True if successful, false otherwise.
 */
export async function deleteAvatar(
  supabaseClient: SupabaseClient,
  avatarPath: string
): Promise<boolean> {
  if (!avatarPath) return true; // No path to delete

  // Extract the path relative to the bucket if a full URL is passed
  // This is a basic attempt; a more robust URL parser might be needed if URLs vary significantly
  let pathInBucket = avatarPath;
  const bucketBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}/`;
  if (avatarPath.startsWith(bucketBaseUrl)) {
    pathInBucket = avatarPath.substring(bucketBaseUrl.length);
  }
  
  if (!pathInBucket) {
    console.warn("Could not determine path in bucket for deletion:", avatarPath);
    return false;
  }

  const { error } = await supabaseClient.storage
    .from(AVATAR_BUCKET)
    .remove([pathInBucket]);

  if (error) {
    console.error('Error deleting old avatar:', error.message);
    // Don't throw, as updating profile is more critical than deleting old avatar
    return false; 
  }
  return true;
}
