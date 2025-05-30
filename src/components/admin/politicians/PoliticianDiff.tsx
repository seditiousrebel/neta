// src/components/admin/politicians/PoliticianDiff.tsx
"use client";

import React from 'react';
import type { PoliticianFormData } from '@/components/contribute/PoliticianForm'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image'; // For photo preview
import { getPublicUrlForMediaAsset } from '@/lib/uploadUtils'; // To get photo URL
import { Skeleton } from '@/components/ui/skeleton'; // For photo loading

interface PoliticianDiffProps {
  oldData?: Partial<PoliticianFormData> | null; 
  newData: PoliticianFormData; 
  entityId?: string | number | null; // Present if editing, absent or null for new
}

const DataField: React.FC<{ label: string; value: any; oldValue?: any; isChanged?: boolean; isJson?: boolean }> = ({ label, value, oldValue, isChanged, isJson }) => {
    let displayValue = value;
    let displayOldValue = oldValue;

    if (isJson) {
        const formatJson = (jsonVal: any) => {
            if (jsonVal === undefined || jsonVal === null || jsonVal === '') return "Not provided";
            try {
                const parsed = typeof jsonVal === 'string' ? JSON.parse(jsonVal) : jsonVal;
                return JSON.stringify(parsed, null, 2);
            } catch (e) {
                return String(jsonVal); // Show as string if parsing fails
            }
        };
        displayValue = formatJson(value);
        displayOldValue = formatJson(oldValue);
    } else {
        displayValue = value !== undefined && value !== null && value !== '' ? String(value) : <span className="italic text-muted-foreground/80">Not provided</span>;
        displayOldValue = oldValue !== undefined && oldValue !== null && oldValue !== '' ? String(oldValue) : "";
    }
    
    const isValueEffectivelyEmpty = value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    const isOldValueEffectivelyEmpty = oldValue === undefined || oldValue === null || (typeof oldValue === 'string' && oldValue.trim() === '');

    if (isValueEffectivelyEmpty && isOldValueEffectivelyEmpty && !isChanged) {
        return null;
    }
    
    let changeIndicator = "";
    if (isChanged) {
        if (!isValueEffectivelyEmpty && isOldValueEffectivelyEmpty) changeIndicator = "(New field)";
        else if (isValueEffectivelyEmpty && !isOldValueEffectivelyEmpty) changeIndicator = "(Field removed)";
        else changeIndicator = "(Changed)";
    }

    return (
        <div className={`py-2 border-b border-border/30 last:border-b-0 ${isChanged ? 'bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md my-1' : 'p-2'}`}>
            <span className="font-semibold text-sm text-muted-foreground">{label} {isChanged && <span className="text-xs text-primary">{changeIndicator}</span>}</span>
            {isJson ? (
                 <pre className={`text-xs whitespace-pre-wrap mt-1 p-2 rounded bg-muted/30 dark:bg-card-foreground/5 border dark:border-border/20 ${isChanged ? 'text-foreground' : 'text-foreground/90'}`}>{displayValue}</pre>
            ) : (
                 <div className={`text-sm whitespace-pre-wrap mt-0.5 ${isChanged ? 'text-foreground font-medium' : 'text-foreground/90'}`}>{displayValue}</div>
            )}
            {isChanged && !isOldValueEffectivelyEmpty && changeIndicator === "(Changed)" && (
                <div className="text-xs text-orange-600 dark:text-orange-400 ml-2 pl-2 border-l-2 border-orange-300 dark:border-orange-500 mt-1">
                    <span className="italic">Previously:</span> 
                    {isJson ? (
                        <pre className="inline whitespace-pre-wrap ml-1">{displayOldValue}</pre>
                    ) : (
                        <span className="inline whitespace-pre-wrap ml-1">{displayOldValue}</span>
                    )}
                </div>
            )}
        </div>
    );
};

const PhotoPreview: React.FC<{ assetId: string | null | undefined }> = ({ assetId }) => {
    const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        if (assetId) {
            setIsLoading(true);
            getPublicUrlForMediaAsset(assetId)
                .then(url => {
                    setPhotoUrl(url);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching photo preview URL:", err);
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
            setPhotoUrl(null);
        }
    }, [assetId]);

    if (isLoading) {
        return <Skeleton className="w-32 h-32 rounded-md" />;
    }
    if (!photoUrl) {
        return <p className="text-xs text-muted-foreground italic">No photo provided or URL unavailable.</p>;
    }
    return <Image src={photoUrl} alt="Politician Photo Preview" width={128} height={128} className="rounded-md object-cover border" data-ai-hint="politician photo" />;
};


const PoliticianDiff: React.FC<PoliticianDiffProps> = ({ oldData, newData, entityId }) => {
  const isNewSubmission = !entityId || !oldData;

  const fieldsToDisplay: Array<{key: keyof PoliticianFormData, label: string, isJson?: boolean}> = [
    { key: 'name', label: 'Name (English)' },
    { key: 'name_nepali', label: 'Name (Nepali)' },
    { key: 'dob', label: 'Date of Birth (YYYY-MM-DD)' },
    { key: 'gender', label: 'Gender' },
    { key: 'biography', label: 'Biography' },
    { key: 'education_details', label: 'Education Details', isJson: true },
    { key: 'political_journey', label: 'Political Journey', isJson: true },
    { key: 'criminal_records', label: 'Criminal Records', isJson: true },
    { key: 'asset_declarations', label: 'Asset Declarations', isJson: true },
    // Nested objects need special handling or flattening for this simple diff
    // For now, display them as JSON strings if they exist
  ];

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>{isNewSubmission ? "New Politician Submission Review" : "Review Politician Edit"}</CardTitle>
        <CardDescription>
          {isNewSubmission 
            ? "This is a proposal for a new politician. All data shown below is part of this new submission." 
            : "Comparing proposed changes to the existing record. Highlighted fields indicate differences."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="mb-4">
            <DataField label="Photo" value={newData.photo_asset_id ? <PhotoPreview assetId={newData.photo_asset_id} /> : "No photo asset ID"} oldValue={oldData?.photo_asset_id ? <PhotoPreview assetId={oldData.photo_asset_id} /> : "No photo asset ID"} isChanged={newData.photo_asset_id !== oldData?.photo_asset_id} />
        </div>
        {fieldsToDisplay.map(({key, label, isJson}) => {
          const newValue = newData[key];
          const currentValue = oldData ? (oldData as any)[key] : undefined;
          // More robust change check for objects/arrays if not stringified JSON in DB
          const isValueChanged = JSON.stringify(currentValue) !== JSON.stringify(newValue);
          
          const isNewValueEffectivelyEmpty = newValue === undefined || newValue === null || (typeof newValue === 'string' && newValue.trim() === '');
          const isOldValueEffectivelyEmpty = currentValue === undefined || currentValue === null || (typeof currentValue === 'string' && currentValue.trim() === '');

          if (isNewSubmission && isNewValueEffectivelyEmpty) return null; // Don't show empty fields for new submissions
          if (!isNewSubmission && isNewValueEffectivelyEmpty && isOldValueEffectivelyEmpty && !isValueChanged) return null; // Don't show if both empty and no change

          return (
            <DataField 
              key={key} 
              label={label} 
              value={newValue} 
              oldValue={currentValue}
              isChanged={isValueChanged && !isNewSubmission} // Only mark as changed if it's an edit
              isJson={isJson}
            />
          );
        })}
        {newData.contact_information && Object.keys(newData.contact_information).length > 0 && (
             <DataField label="Contact Information" value={newData.contact_information} oldValue={oldData?.contact_information} isChanged={JSON.stringify(newData.contact_information) !== JSON.stringify(oldData?.contact_information)} isJson={true} />
        )}
        {newData.social_media_handles && Object.keys(newData.social_media_handles).length > 0 && (
             <DataField label="Social Media Handles" value={newData.social_media_handles} oldValue={oldData?.social_media_handles} isChanged={JSON.stringify(newData.social_media_handles) !== JSON.stringify(oldData?.social_media_handles)} isJson={true} />
        )}
      </CardContent>
    </Card>
  );
};

export default PoliticianDiff;
