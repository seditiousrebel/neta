// src/components/admin/politicians/PoliticianReview.tsx
"use client";

import React, { useState, useTransition, useEffect, useMemo } from 'react'; // Added useMemo
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge"; // Badge not explicitly used in the component code provided
import { ScrollArea } from "@/components/ui/scroll-area';
import { 
  approvePendingEditAction, 
  denyPendingEditAction,
  approveNewPoliticianAction 
} from "@/lib/actions/moderation.actions";
import type { AdminPendingEdit } from '@/types/entities';
import type { PoliticianFormData } from '@/components/contribute/PoliticianForm';
import { getPoliticianById } from '@/lib/supabase/politicians';
import PoliticianDiff from '@/components/admin/politicians/PoliticianDiff';
import { Skeleton } from '@/components/ui/skeleton';
import { getPublicUrlForMediaAsset } from '@/lib/uploadUtils'; // Import for photo URL
import Image from 'next/image'; // For optimized image rendering

interface PoliticianReviewProps {
  edit: AdminPendingEdit;
  adminId: string; 
  onActionComplete?: () => void;
}

// Helper to render individual fields (DataField component remains unchanged)
const DataField: React.FC<{ label: string; value: any; isJson?: boolean }> = ({ label, value, isJson }) => {
  let displayValue = value;
  if (value === null || value === undefined || value === '') {
    displayValue = <span className="text-gray-500 italic">Not provided</span>;
  } else if (isJson && typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      displayValue = (
        <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs whitespace-pre-wrap break-all">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch (e) {
      // If parsing fails, show raw string but indicate it was expected to be JSON
      displayValue = (
        <>
          <p className="text-red-500 text-xs mb-1">(Expected JSON, but failed to parse)</p>
          <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs whitespace-pre-wrap break-all">
            {value}
          </pre>
        </>
      );
    }
  } else if (typeof value === 'object') {
    displayValue = (
      <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs whitespace-pre-wrap break-all">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  } else if (typeof value === 'boolean') {
    displayValue = value ? 'Yes' : 'No';
  }


  return (
    <div className="mb-3">
      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">{label}:</h4>
      {typeof displayValue === 'string' ? <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">{displayValue}</p> : displayValue}
    </div>
  );
};


const PoliticianReview: React.FC<PoliticianReviewProps> = ({ edit, adminId, onActionComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const [currentPoliticianData, setCurrentPoliticianData] = useState<Partial<PoliticianFormData> | null>(null);
  const [isLoadingCurrentData, setIsLoadingCurrentData] = useState(false);
  const [fetchErrorCurrentData, setFetchErrorCurrentData] = useState<string | null>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const proposedData = edit.proposed_data as Partial<PoliticianFormData>;
  const isEditOfExistingEntity = !!edit.entity_id;

  // Memoize photo_asset_id to prevent unnecessary useEffect runs if proposedData object changes but id remains same
  const photoAssetIdFromProposedData = useMemo(() => proposedData?.photo_asset_id, [proposedData?.photo_asset_id]);

  useEffect(() => {
    const fetchAndSetPhotoUrl = async (assetId: string) => {
      setIsPhotoLoading(true);
      setPhotoError(null);
      try {
        const url = await getPublicUrlForMediaAsset(assetId);
        setPhotoUrl(url);
        if (!url) {
          setPhotoError("Photo not found or URL could not be generated.");
        }
      } catch (error: any) {
        console.error("Error fetching photo URL:", error);
        setPhotoError(error.message || "Error fetching photo.");
      } finally {
        setIsPhotoLoading(false);
      }
    };

    if (isOpen && photoAssetIdFromProposedData) {
      fetchAndSetPhotoUrl(photoAssetIdFromProposedData);
    } else if (!isOpen) {
      setPhotoUrl(null); // Reset photo URL when dialog closes
      setIsPhotoLoading(false);
      setPhotoError(null);
    }
  }, [isOpen, photoAssetIdFromProposedData]);

  useEffect(() => {
    // Fetch current politician data for diff view
    if (isOpen && isEditOfExistingEntity && !currentPoliticianData && !isLoadingCurrentData) {
      const fetchCurrentData = async () => {
        setIsLoadingCurrentData(true);
        setFetchErrorCurrentData(null);
        try {
          if (edit.entity_id) {
            const data = await getPoliticianById(edit.entity_id);
            if (data) {
              setCurrentPoliticianData(data);
            } else {
              setFetchErrorCurrentData("Could not load current politician data. It might have been deleted.");
            }
          } else {
             setFetchErrorCurrentData("Entity ID is missing, cannot fetch current data.");
          }
        } catch (error: any) {
          console.error("Error fetching current politician data:", error);
          setFetchErrorCurrentData(error.message || "An unexpected error occurred while fetching current data.");
        } finally {
          setIsLoadingCurrentData(false);
        }
      };
      fetchCurrentData();
    } else if (!isOpen) {
      // Reset when dialog is closed
      setCurrentPoliticianData(null);
      setIsLoadingCurrentData(false);
      setFetchErrorCurrentData(null);
      setActionError(null); // Also reset action error
    }
  }, [isOpen, isEditOfExistingEntity, edit.entity_id, currentPoliticianData, isLoadingCurrentData]);


  const handleApprove = async () => {
    setActionError(null);
    startTransition(async () => {
      let result;
      if (edit.entity_type === 'Politician' && !edit.entity_id) {
        // This is a new politician submission
        result = await approveNewPoliticianAction(edit.id);
      } else {
        // This is an edit to an existing entity (politician or other)
        // or a new entity of a different type (though this component is PoliticianReview)
        result = await approvePendingEditAction(edit.id);
      }

      if (result.success) {
        setIsOpen(false);
        if (onActionComplete) onActionComplete();
      } else {
        setActionError(result.error || "An unknown error occurred during approval.");
      }
    });
  };

  const handleDeny = async () => {
    setActionError(null);
    // Optionally, prompt for a denial reason here
    startTransition(async () => {
      const result = await denyPendingEditAction(edit.id); // Reason can be added if moderation.actions supports it
      if (result.success) {
        setIsOpen(false);
        onActionComplete?.();
      } else {
        setActionError(result.error || "Failed to deny edit.");
      }
    });
  };
  
  const proposer = edit.users; // Proposer info

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Review Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review Politician Edit #{edit.id}</DialogTitle>
          <DialogDescription>
            Proposed by: {proposer?.full_name || proposer?.email || 'Unknown User'} (ID: {edit.proposer_id})
            <br />
            Change Reason: {edit.change_reason || <span className="italic">Not provided</span>}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] p-4 border rounded-md">
          {isEditOfExistingEntity ? (
            // Displaying Diff for existing politician
            isLoadingCurrentData ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <p className="text-center text-muted-foreground">Loading current data for comparison...</p>
              </div>
            ) : fetchErrorCurrentData ? (
              <div className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 p-3 rounded-md">
                Error loading current data: {fetchErrorCurrentData}
              </div>
            ) : currentPoliticianData ? (
              <PoliticianDiff oldData={currentPoliticianData} newData={proposedData as PoliticianFormData} />
            ) : (
              <p className="text-center text-muted-foreground">Could not load current data to show differences.</p>
            )
          ) : (
            // Displaying proposed data directly (for new politician)
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-2 border-b pb-1">Proposed Data (New Politician)</h3>
              
              {/* Photo Preview Section for New Politician */}
              {photoAssetIdFromProposedData && (
                <div className="mb-4 p-2 border rounded-md">
                  <h4 className="font-semibold text-sm mb-1">Proposed Photo:</h4>
                  {isPhotoLoading && <Skeleton className="w-32 h-32 rounded-md" />}
                  {photoError && <p className="text-xs text-red-500">Error: {photoError}</p>}
                  {photoUrl && !isPhotoLoading && !photoError && (
                    <Image 
                      src={photoUrl} 
                      alt="Proposed Politician Photo" 
                      width={128} 
                      height={128} 
                      className="rounded-md object-cover" 
                    />
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Asset ID: {photoAssetIdFromProposedData}</p>
                </div>
              )}

              {proposedData.name && <DataField label="Name (English)" value={proposedData.name} />}
              {proposedData.name_nepali && <DataField label="Name (Nepali)" value={proposedData.name_nepali} />}
              {proposedData.dob && <DataField label="Date of Birth (BS, YYYY-MM-DD)" value={proposedData.dob} />}
              {proposedData.gender && <DataField label="Gender" value={proposedData.gender} />}
              {/* Removed direct display of photo_asset_id string here as it's covered by the preview block */}
              {proposedData.biography && <DataField label="Biography" value={proposedData.biography} />}
              <DataField label="Education Details" value={proposedData.education_details} isJson />
              <DataField label="Political Journey" value={proposedData.political_journey} isJson />
              <DataField label="Criminal Records" value={proposedData.criminal_records} isJson />
              <DataField label="Asset Declarations" value={proposedData.asset_declarations} isJson />

              {proposedData.contact_information && (
                <div>
                  <h4 className="font-semibold text-md my-2 border-b pb-1">Contact Information</h4>
                  <DataField label="Email" value={proposedData.contact_information.email} />
                  <DataField label="Phone" value={proposedData.contact_information.phone} />
                  <DataField label="Address" value={proposedData.contact_information.address} />
                </div>
              )}

              {proposedData.social_media_handles && (
                <div>
                  <h4 className="font-semibold text-md my-2 border-b pb-1">Social Media</h4>
                  <DataField label="Twitter" value={proposedData.social_media_handles.twitter} />
                  <DataField label="Facebook" value={proposedData.social_media_handles.facebook} />
                  <DataField label="Instagram" value={proposedData.social_media_handles.instagram} />
                </div>
              )}
            </div>
          )}
          {/* Common elements like Google Search links can be outside the conditional block if always shown */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-sm mb-2">Quick Google Search:</h4>
            <ul className="list-disc list-inside space-y-1">
                <li>
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(proposedData.name || '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Search for "{proposedData.name}" on Google
                  </a>
                </li>
                <li>
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(proposedData.name || '')}+politics`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Search for "{proposedData.name} + politics" on Google
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </ScrollArea>

        {actionError && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 p-2 rounded-md my-2">{actionError}</p>
        )}

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <DialogClose asChild>
             <Button variant="outline" disabled={isPending}>Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDeny} disabled={isPending}>
            {isPending ? "Denying..." : "Deny Edit"}
          </Button>
          <Button onClick={handleApprove} disabled={isPending}>
            {isPending ? "Approving..." : "Approve Edit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PoliticianReview;
