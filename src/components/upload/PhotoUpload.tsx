// src/components/upload/PhotoUpload.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop, { Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context'; // Ensure this path is correct
import { uploadAndCreateMediaAsset } from '@/lib/uploadUtils'; // Ensure this path is correct

interface PhotoUploadProps {
  onUploadComplete: (assetId: string) => void;
  assetType: string;
  aspectRatio?: number; // e.g., 1 for square, 16/9 for landscape
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onUploadComplete, assetType, aspectRatio = 1 }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop | undefined>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth(); 

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
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const currentFile = acceptedFiles[0];
      setFile(currentFile);
      setError(null);
      setCompletedCrop(null); 
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
        }, file?.type || 'image/jpeg', 0.85); // Adjust quality if needed
    });
  };
  
  const handleUpload = async () => {
    if (!user) {
      setError('User not logged in.');
      return;
    }
    if (!file) {
        setError('No file selected.');
        return;
    }

    setIsLoading(true);
    setError(null);

    let fileToUpload = file;

    if (imgRef.current && completedCrop && completedCrop.width && completedCrop.height) {
        const croppedBlob = await getCroppedImgBlob(imgRef.current, completedCrop);
        if (croppedBlob) {
            fileToUpload = new File([croppedBlob], file.name, { type: file.type });
        } else {
            setError("Could not process the cropped image. Please try again.");
            setIsLoading(false);
            return;
        }
    }

    try {
      const result = await uploadAndCreateMediaAsset(fileToUpload, assetType, user.id);
      if (result && result.id) {
        onUploadComplete(result.id);
        setImageSrc(null);
        setFile(null);
        setCrop(undefined);
        setCompletedCrop(null);
        imgRef.current = null;
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
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the image here ...</p>
        ) : (
          <p>Drag 'n' drop an image here, or click to select one</p>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {imageSrc && (
        <div className="mt-4 flex flex-col items-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            minWidth={100} 
            minHeight={100} 
          >
            <img 
              src={imageSrc} 
              alt="Preview" 
              onLoad={onImageLoad}
              style={{ maxHeight: '400px', objectFit: 'contain' }} 
            />
          </ReactCrop>
        </div>
      )}

      {file && (
        <div className="mt-4 flex flex-col items-center">
          <p className="text-sm text-gray-600 mb-2">File: {file.name}</p>
          <Button 
            onClick={handleUpload} 
            disabled={isLoading || !user || (!file && !imageSrc) || (imageSrc && (!completedCrop || completedCrop.width === 0))}
          >
            {isLoading ? 'Uploading...' : (completedCrop && imageSrc && completedCrop.width > 0 ? 'Upload Cropped Image' : 'Upload Original Image')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
