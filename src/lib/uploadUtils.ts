// src/lib/uploadUtils.ts
import { supabase } from './supabase/client'; // Adjust path as needed
import { v4 as uuidv4 } from 'uuid';

export interface MediaAsset {
  id: string; 
  file_name: string;
  storage_path: string;
  asset_type: string;
  uploader_id: string; 
  file_size: number;
  mime_type: string;
  created_at?: string;
  updated_at?: string;
}

export async function uploadAndCreateMediaAsset(
  file: File,
  assetType: string,
  userId: string 
): Promise<MediaAsset | null> {
  if (!file || !userId) {
    console.error('File or userId missing for upload');
    return null;
  }

  const fileExtension = file.name.split('.').pop();
  const randomFileName = `${uuidv4()}.${fileExtension}`;
  const filePath = `public/${assetType}/${userId}/${randomFileName}`;

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media_assets') 
      .upload(filePath, file, {
        cacheControl: '3600', 
        upsert: false, 
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    if (!uploadData) {
        throw new Error('No data returned from storage upload (uploadData is null).');
    }
    
    const assetRecordToInsert = {
      file_name: file.name, 
      storage_path: uploadData.path, 
      asset_type: assetType,
      uploader_id: userId,
      file_size: file.size,
      mime_type: file.type,
    };

    const { data: dbData, error: dbError } = await supabase
      .from('media_assets') 
      .insert(assetRecordToInsert)
      .select() 
      .single(); 

    if (dbError) {
      console.error('Database insert error:', dbError);
      throw dbError;
    }
    
    if (!dbData) {
        throw new Error('No data returned from database insert (dbData is null).');
    }

    return dbData as MediaAsset;

  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    console.error(`Error in uploadAndCreateMediaAsset for ${assetType} by ${userId}:`, message);
    // TODO: Consider deleting the uploaded file from storage if DB insert fails
    return null;
  }
}

/**
 * Retrieves the public URL for a media asset given its asset ID.
 * @param assetId The ID of the media asset (from the `media_assets` table).
 * @returns A promise that resolves to the public URL string or null if an error occurs or asset not found.
 */
export async function getPublicUrlForMediaAsset(assetId: string): Promise<string | null> {
  if (!assetId) {
    console.error("getPublicUrlForMediaAsset: assetId is required.");
    return null;
  }

  try {
    // 1. Fetch the media_asset record to get the storage_path
    const { data: assetRecord, error: fetchError } = await supabase
      .from('media_assets')
      .select('storage_path')
      .eq('id', assetId)
      .single();

    if (fetchError) {
      console.error(`Error fetching media asset ${assetId}:`, fetchError.message);
      return null;
    }

    if (!assetRecord || !assetRecord.storage_path) {
      console.warn(`Media asset ${assetId} not found or storage_path is missing.`);
      return null;
    }

    // 2. Get the public URL from Supabase storage
    const { data: publicUrlData } = supabase.storage
      .from('media_assets') // The bucket name
      .getPublicUrl(assetRecord.storage_path);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.warn(`Could not get public URL for storage path: ${assetRecord.storage_path}`);
      return null;
    }

    return publicUrlData.publicUrl;

  } catch (error: any) {
    console.error(`Unexpected error in getPublicUrlForMediaAsset for assetId ${assetId}:`, error.message);
    return null;
  }
}
