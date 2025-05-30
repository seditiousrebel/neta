
// src/components/upload/PhotoUpload.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop, { Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context'; 
import { uploadAndCreateMediaAsset, getPublicUrlForMediaAsset } from '@/lib/uploadUtils'; 
import Image from 'next/image'; // For displaying initial preview
import { Loader2 } from 'lucide-react'; // For loading state

interface PhotoUploadProps {
  onUploadComplete: (assetId: string) => void;
  assetType: string;
  aspectRatio?: number; 
  initialPreviewUrl?: string | null; // For edit mode: existing asset ID or direct URL
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
    onUploadComplete, 
    assetType, 
    aspectRatio = 1,
    initialPreviewUrl 
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop | undefined>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialUrlLoading, setIsInitialUrlLoading] = useState(false);
  const { user } = useAuth(); 

  useEffect(() => {
    if (initialPreviewUrl) {
      // If it's a full URL, use it directly. If it's an asset ID, fetch the URL.
      if (initialPreviewUrl.startsWith('http')) {
        setImageSrc(initialPreviewUrl);
      } else {
        // Assume it's an asset ID
        setIsInitialUrlLoading(true);
        getPublicUrlForMediaAsset(initialPreviewUrl)
          .then(url => {
            if (url) setImageSrc(url);
            else console.warn("Could not fetch initial preview URL for asset ID:", initialPreviewUrl);
          })
          .catch(err => console.error("Error fetching initial preview:", err))
          .finally(() => setIsInitialUrlLoading(false));
      }
    }
  }, [initialPreviewUrl]);


  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    const newCrop = centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90, 
            },
            aspectRatio,
            width,
            height
        ),
        width,
        height
    );
    setCrop(newCrop);
    setCompletedCrop(null); // Reset completed crop when new image loads
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const currentFile = acceptedFiles[0];
      setFile(currentFile);
      setError(null);
      setCompletedCrop(null); 
      imgRef.current = null; // Reset imgRef so new image dimensions are used
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(currentFile);
    } else {
      setError("No valid file selected or file type not accepted.");
    }
  }, [aspectRatio]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: false,
  });

  const getCroppedImgBlob = (image: HTMLImageElement, cropToUse: PixelCrop): Promise<Blob | null> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = cropToUse.width;
        canvas.height = cropToUse.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            console.error("Failed to get 2D context");
            resolve(null);
            return;
        }

        ctx.drawImage(
            image,
            cropToUse.x,
            cropToUse.y,
            cropToUse.width,
            cropToUse.height,
            0,
            0,
            cropToUse.width,
            cropToUse.height
        );

        canvas.toBlob((blob) => {
            resolve(blob);
        }, file?.type || 'image/jpeg', 0.85); 
    });
  };
  
  const handleUpload = async () => {
    if (!user) {
      setError('User not logged in.');
      return;
    }
    if (!file && !imageSrc) { // If no new file and no existing image to re-process (though re-process isn't typical without a new file)
        setError('No file selected for upload.');
        return;
    }

    setIsLoading(true);
    setError(null);

    let fileToUpload = file; // If a new file was dropped, use it

    // If there's no new file, but there's an imageSrc (from initialData) and a crop,
    // it implies re-cropping an existing image. This is complex and usually not how asset_id based systems work.
    // For now, we only upload if a new `file` is present.
    // If an existing image (initialPreviewUrl) is shown and user wants to "re-upload" it (e.g. after cropping),
    // they should re-select the original file.
    // This logic primarily handles NEW file uploads.
    
    if (fileToUpload && imgRef.current && completedCrop && completedCrop.width && completedCrop.height) {
        const croppedBlob = await getCroppedImgBlob(imgRef.current, completedCrop);
        if (croppedBlob) {
            fileToUpload = new File([croppedBlob], fileToUpload.name, { type: fileToUpload.type });
        } else {
            setError("Could not process the cropped image. Please try again.");
            setIsLoading(false);
            return;
        }
    } else if (!fileToUpload) {
        // This case means there's an initial image, no new file, and maybe no crop.
        // We typically don't "re-upload" just because of a crop on an existing remote image.
        // The onUploadComplete usually expects a NEW asset ID.
        // If the intention is to just update the crop coordinates for an existing image, that's a different system.
        // For now, let's assume upload means a new file (or new version of one).
        setError("No new file selected for upload. If you re-cropped, please re-select the image to upload the new version.");
        setIsLoading(false);
        return;
    }


    try {
      const result = await uploadAndCreateMediaAsset(fileToUpload, assetType, user.id);
      if (result && result.id) {
        onUploadComplete(result.id); // This returns the NEW asset ID
        // Don't clear imageSrc if it came from initialPreviewUrl and no new file was dropped
        // This is tricky: if they upload a new file, we should clear. If it's from initialData, it's up to parent.
        // For now, let parent handle resetting initialPreviewUrl if desired after successful upload.
        // setFile(null); // Clear the dropped file
        // setCrop(undefined);
        // setCompletedCrop(null);
        // imgRef.current = null; 
        // The parent form will likely re-render with the new asset_id, which would update initialPreviewUrl
      } else {
        throw new Error('Upload failed or asset ID not returned.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during upload.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`p-6 border-2 border-dashed rounded-md text-center cursor-pointer
                    ${isDragActive ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the image here ...</p>
        ) : (
          <p>Drag 'n' drop an image here, or click to select one</p>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {isInitialUrlLoading && <Loader2 className="mx-auto my-4 h-6 w-6 animate-spin text-primary" />}
      
      {imageSrc && !isInitialUrlLoading && (
        <div className="mt-4 flex flex-col items-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            minWidth={100} 
            minHeight={100} 
          >
            <Image // Use Next/Image for better performance and optimization
              src={imageSrc} 
              alt="Preview" 
              width={0} // Required for layout="responsive" if not fill
              height={0}
              sizes="100vw"
              style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain' }}
              onLoad={onImageLoad}
              priority={false}
            />
          </ReactCrop>
        </div>
      )}

      {(file || (imageSrc && completedCrop)) && ( // Allow upload if new file OR existing image is cropped
        <div className="mt-4 flex flex-col items-center">
          {file && <p className="text-sm text-muted-foreground mb-2">New file: {file.name}</p>}
          <Button 
            onClick={handleUpload} 
            disabled={isLoading || !user || (!file && (!imageSrc || !completedCrop || completedCrop.width === 0))}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Upload Image'}
          </Button>
          {imageSrc && completedCrop && completedCrop.width > 0 && !file && (
            <p className="text-xs text-muted-foreground mt-1">Note: Re-select file to upload a cropped version of an existing image.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
    