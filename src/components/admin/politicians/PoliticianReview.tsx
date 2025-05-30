// src/components/admin/politicians/PoliticianReview.tsx
"use client";

import React, { useState, useTransition } from 'react';
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
import type { PoliticianFormData } from '@/components/contribute/PoliticianForm'; // Using the form data type

interface PoliticianReviewProps {
  edit: AdminPendingEdit;
  adminId: string; // For logging or specific actions if needed later
  onActionComplete?: () => void; // Callback after approve/deny
}

// Helper to render individual fields
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

  const proposedData = edit.proposed_data as Partial<PoliticianFormData>; // Cast to allow partial data

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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2 border-b pb-1">Proposed Data</h3>
            
            {proposedData.name && <DataField label="Name (English)" value={proposedData.name} />}
            {proposedData.name_nepali && <DataField label="Name (Nepali)" value={proposedData.name_nepali} />}
            {proposedData.dob && <DataField label="Date of Birth (BS, YYYY-MM-DD)" value={proposedData.dob} />}
            {proposedData.gender && <DataField label="Gender" value={proposedData.gender} />}

            {proposedData.photo_asset_id && (
              <div className="mb-3">
                <h4 className="font-semibold text-sm">Photo Asset ID:</h4>
                <p className="text-sm">{proposedData.photo_asset_id}</p>
                {/* TODO: Implement image preview using a utility like getPublicUrl(assetId) */}
                <div className="mt-1 p-2 border rounded text-xs bg-gray-100 dark:bg-gray-800">
                  [Image Preview Placeholder for asset_id: {proposedData.photo_asset_id}]
                  <br />
                  (Requires `getPublicUrl(assetId)` utility and `<Image>` component)
                </div>
              </div>
            )}

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
