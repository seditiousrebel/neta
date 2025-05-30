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
