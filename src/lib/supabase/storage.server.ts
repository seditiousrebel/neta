"use server"; 

import { createSupabaseServerClient } from "@/lib/supabase/server"; 

export async function getPublicUrlForMediaAsset(assetId: string): Promise<string | null> {
  if (!assetId) {
    console.log("getPublicUrlForMediaAsset: assetId is null or undefined.");
    return null;
  }
  
  const supabase = createSupabaseServerClient();
  try {
    console.log(`getPublicUrlForMediaAsset: Fetching media asset for ID: ${assetId}`);
    const { data: mediaAsset, error: fetchError } = await supabase
      .from('media_assets')
      .select('storage_path')
      .eq('id', assetId)
      .single();

    if (fetchError) {
      console.error(`Error fetching media asset ${assetId} for public URL:`, fetchError.message);
      return null;
    }
    if (!mediaAsset) {
      console.warn(`No media asset found for ID: ${assetId}`);
      return null;
    }
    if (!mediaAsset.storage_path) {
        console.warn(`No storage_path found for media asset ${assetId}.`);
        return null;
    }

    console.log(`getPublicUrlForMediaAsset: Getting public URL for path: ${mediaAsset.storage_path}`);
    const { data: urlData } = supabase.storage
      .from('media_assets') // Ensure this is your bucket name
      .getPublicUrl(mediaAsset.storage_path);

    console.log(`getPublicUrlForMediaAsset: Public URL for ${assetId} is ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error: any) {
    console.error(`Unexpected error in getPublicUrlForMediaAsset for ${assetId}:`, error.message);
    return null;
  }
}
