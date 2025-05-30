
"use client"; // Can be used client-side for direct uploads

import type { SupabaseClient } from '@supabase/supabase-js';

const AVATAR_BUCKET = 'avatars';

/**
 * Uploads a file to a specified Supabase Storage bucket.
 * @param supabaseClient The Supabase client instance.
 * @param file The file to upload.
 * @param bucketName The name of the bucket to upload to.
 * @param options Optional parameters for path and upload settings.
 * @param options.pathPrefix Optional prefix for the file path within the bucket (e.g., "user_id/" or "politician_photos/"). Include a trailing slash if it's a folder.
 * @param options.fileName Optional custom file name. If not provided, a timestamped name will be generated.
 * @param options.upsert Whether to overwrite an existing file at the same path. Defaults to true.
 * @param options.cacheControl Cache-Control header value. Defaults to '3600'.
 * @returns The path and public URL of the uploaded file.
 * @throws If the upload fails.
 */
export async function uploadMediaAsset(
  supabaseClient: SupabaseClient,
  file: File,
  bucketName: string,
  options?: {
    pathPrefix?: string;
    fileName?: string;
    upsert?: boolean;
    cacheControl?: string;
  }
): Promise<{ path: string; publicUrl: string }> {
  const fileExt = file.name.split('.').pop();
  const effectiveFileName = options?.fileName || `${Date.now()}.${fileExt}`;
  const effectivePathPrefix = options?.pathPrefix || '';
  const filePath = `${effectivePathPrefix}${effectiveFileName}`;

  const { data, error } = await supabaseClient.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: options?.cacheControl || '3600',
      upsert: options?.upsert === undefined ? true : options.upsert,
    });

  if (error) {
    console.error(`Error uploading to ${bucketName}:`, error);
    throw new Error(`Upload to ${bucketName} failed: ${error.message}`);
  }

  if (!data?.path) {
    console.error(`Error uploading to ${bucketName}: No path returned`);
    throw new Error(`Upload to ${bucketName} failed: No path returned from storage.`);
  }

  const { data: urlData } = supabaseClient.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    console.error(`Error getting public URL from ${bucketName} for path:`, data.path);
    throw new Error('Failed to get public URL for asset.');
  }
  
  return { path: data.path, publicUrl: urlData.publicUrl };
}


/**
 * Uploads an avatar image to Supabase Storage in the 'avatars' bucket.
 * @param supabaseClient The Supabase client instance.
 * @param userId The ID of the user.
 * @param file The avatar file to upload.
 * @returns The path and public URL of the uploaded avatar.
 * @throws If the upload fails.
 */
export async function uploadAvatar(
  supabaseClient: SupabaseClient,
  userId: string,
  file: File
): Promise<{ path: string; publicUrl: string }> {
  return uploadMediaAsset(supabaseClient, file, AVATAR_BUCKET, {
    pathPrefix: `${userId}/`, // User-specific folder
  });
}

/**
 * Retrieves the public URL for a given avatar path.
 * Note: This is often not needed if you store the full public URL directly.
 * @param supabaseClient The Supabase client instance.
 * @param path The path to the avatar in Supabase Storage (e.g., "user_id/avatar.png").
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
 * Deletes an asset from a specified Supabase Storage bucket.
 * @param supabaseClient The Supabase client instance.
 * @param bucketName The name of the bucket.
 * @param filePath The path of the file within the bucket (e.g., "user_id/avatar.png" or "some_image.jpg").
 * @returns True if successful or if path is empty, false if an error occurs.
 */
export async function deleteMediaAsset(
  supabaseClient: SupabaseClient,
  bucketName: string,
  filePath: string
): Promise<boolean> {
  if (!filePath || filePath.trim() === '') {
    console.warn("deleteMediaAsset: No file path provided for deletion.");
    return true; // No path to delete, consider it success
  }

  // The filePath here should be the path within the bucket, not a full URL.
  const { error } = await supabaseClient.storage
    .from(bucketName)
    .remove([filePath]);

  if (error) {
    console.error(`Error deleting asset from ${bucketName} at path ${filePath}:`, error.message);
    return false; 
  }
  return true;
}


/**
 * Deletes an avatar from Supabase Storage.
 * @param supabaseClient The Supabase client instance.
 * @param avatarIdentifier The path of the avatar file in storage (e.g., "user_id/avatar.png") OR the full public URL.
 * @returns True if successful or if path is empty/invalid, false if an error occurs.
 */
export async function deleteAvatar(
  supabaseClient: SupabaseClient,
  avatarIdentifier: string
): Promise<boolean> {
  if (!avatarIdentifier || avatarIdentifier.trim() === '') {
    console.warn("deleteAvatar: No avatar identifier provided for deletion.");
    return true; // No path to delete, consider it success
  }

  let pathInBucket = avatarIdentifier;
  
  // Attempt to extract path from a full public URL if one is provided
  // Example URL: https://<project_ref>.supabase.co/storage/v1/object/public/<bucket_name>/<path_to_file>
  try {
    if (avatarIdentifier.startsWith('http')) {
      const url = new URL(avatarIdentifier);
      const parts = url.pathname.split('/');
      // Find bucket name in path, then take everything after it
      const bucketIndex = parts.indexOf(AVATAR_BUCKET);
      if (bucketIndex !== -1 && bucketIndex < parts.length -1) {
        pathInBucket = parts.slice(bucketIndex + 1).join('/');
      } else {
         console.warn("deleteAvatar: Could not reliably parse path from URL:", avatarIdentifier);
         // If parsing fails, we might be trying to delete a non-standard URL or already a path.
         // We'll proceed with pathInBucket as is, which might be the original identifier.
      }
    }
  } catch (e) {
    console.warn("deleteAvatar: Error parsing avatarIdentifier as URL, assuming it's a direct path:", e);
    // If it's not a valid URL, assume avatarIdentifier is already a path.
  }
  
  if (!pathInBucket || pathInBucket.trim() === '') {
    console.warn("deleteAvatar: Derived path for deletion is empty for identifier:", avatarIdentifier);
    return false; // Could not determine a valid path to delete
  }

  return deleteMediaAsset(supabaseClient, AVATAR_BUCKET, pathInBucket);
}
