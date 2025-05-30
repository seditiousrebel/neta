// src/components/admin/politicians/PoliticianReview.tsx
"use client";

import React, { useState, useTransition, useEffect, useMemo } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { AlertCircle, CheckCircle, Loader2, ExternalLink, UserCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PoliticianReviewProps {
  edit: AdminPendingEdit;
  // adminId prop removed as it's derived within actions
  onActionComplete?: () => void;
}

const PoliticianReview: React.FC<PoliticianReviewProps> = ({ edit, onActionComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const { toast } = useToast();

  const [currentPoliticianData, setCurrentPoliticianData] = useState<Partial<PoliticianFormData> | null>(null);
  const [isLoadingCurrentData, setIsLoadingCurrentData] = useState(false);
  const [fetchErrorCurrentData, setFetchErrorCurrentData] = useState<string | null>(null);

  const proposedData = edit.proposed_data as PoliticianFormData; // Assuming proposed_data is always PoliticianFormData for this component
  const isNewPoliticianSubmission = !edit.entity_id;

  useEffect(() => {
    if (isOpen && !isNewPoliticianSubmission && !currentPoliticianData && !isLoadingCurrentData) {
      const fetchCurrentData = async () => {
        setIsLoadingCurrentData(true);
        setFetchErrorCurrentData(null);
        try {
          if (edit.entity_id) { // Should always be true if !isNewPoliticianSubmission
            const data = await getPoliticianById(String(edit.entity_id)); // Ensure ID is string
            if (data) {
              setCurrentPoliticianData(data);
            } else {
              setFetchErrorCurrentData("Could not load current politician data. It might have been deleted.");
            }
          }
        } catch (error: any) {
          console.error("Error fetching current politician data:", error);
          setFetchErrorCurrentData(error.message || "An unexpected error occurred fetching current data.");
        } finally {
          setIsLoadingCurrentData(false);
        }
      };
      fetchCurrentData();
    } else if (!isOpen) {
      // Reset states when dialog closes
      setCurrentPoliticianData(null);
      setIsLoadingCurrentData(false);
      setFetchErrorCurrentData(null);
      setActionError(null);
    }
  }, [isOpen, isNewPoliticianSubmission, edit.entity_id, currentPoliticianData, isLoadingCurrentData]);

  const handleApprove = async () => {
    setActionError(null);
    startTransition(async () => {
      let result;
      if (isNewPoliticianSubmission) {
        result = await approveNewPoliticianAction(edit.id);
      } else {
        result = await approvePendingEditAction(edit.id);
      }

      if (result.success) {
        toast({ title: "Success", description: result.message || "Action completed successfully." });
        setIsOpen(false);
        onActionComplete?.();
      } else {
        setActionError(result.error || "An unknown error occurred.");
        toast({ title: "Error", description: result.error || "Action failed.", variant: "destructive" });
      }
    });
  };

  const handleDeny = async () => {
    setActionError(null);
    startTransition(async () => {
      const result = await denyPendingEditAction(edit.id);
      if (result.success) {
        toast({ title: "Denied", description: result.message || "Edit has been denied." });
        setIsOpen(false);
        onActionComplete?.();
      } else {
        setActionError(result.error || "Failed to deny edit.");
        toast({ title: "Error", description: result.error || "Failed to deny edit.", variant: "destructive" });
      }
    });
  };
  
  const proposer = edit.users;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Review Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl">Review Politician {isNewPoliticianSubmission ? "Submission" : "Edit"} #{edit.id}</DialogTitle>
          <DialogDescription className="text-xs">
            <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-muted-foreground"/>
                <span>Proposed by: {proposer?.full_name || proposer?.email || 'Unknown User'} (ID: {edit.proposer_id})</span>
            </div>
            Change Reason: {edit.change_reason || <span className="italic">Not provided</span>}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow p-1 mt-2 pr-3">
          {isNewPoliticianSubmission ? (
            <PoliticianDiff newData={proposedData} />
          ) : (
            isLoadingCurrentData ? (
              <div className="space-y-4 p-4">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-24 w-full" />
                <p className="text-center text-muted-foreground">Loading current data for comparison...</p>
              </div>
            ) : fetchErrorCurrentData ? (
              <div className="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-4 rounded-md flex items-center gap-2">
                <AlertCircle className="h-5 w-5"/> Error loading current data: {fetchErrorCurrentData}
              </div>
            ) : currentPoliticianData ? (
              <PoliticianDiff oldData={currentPoliticianData} newData={proposedData} entityId={edit.entity_id}/>
            ) : (
              <p className="text-center text-muted-foreground p-4">Could not load current data to show differences.</p>
            )
          )}
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-semibold text-sm mb-2">Quick Google Search:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(proposedData.name || '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    Search for "{proposedData.name}" <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </li>
                <li>
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(proposedData.name || '')}+politics`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    Search for "{proposedData.name} + politics" <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </li>
              </ul>
            </div>
        </ScrollArea>

        {actionError && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-md my-2 flex items-center gap-2">
            <AlertCircle className="h-5 w-5"/> {actionError}
          </p>
        )}

        <DialogFooter className="mt-4 pt-4 border-t gap-2 sm:gap-0">
          <DialogClose asChild>
             <Button variant="outline" disabled={isPending}>Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDeny} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertCircle className="mr-2 h-4 w-4"/>}
            Deny
          </Button>
          <Button onClick={handleApprove} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4"/>}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PoliticianReview;
