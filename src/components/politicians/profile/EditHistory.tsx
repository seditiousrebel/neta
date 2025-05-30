// src/components/politicians/profile/EditHistory.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

interface Revision {
  id: string;
  created_at: string;
  data: any; // The snapshot of politician data
  submitter_user: { full_name: string | null; email: string | null } | null;
  approver_user: { full_name: string | null; email: string | null } | null;
}

interface EditHistoryProps {
  politicianId: string;
}

const EditHistory: React.FC<EditHistoryProps> = ({ politicianId }) => {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any | null>(null);

  useEffect(() => {
    if (!politicianId) {
      setIsLoading(false);
      setError("Politician ID is not provided.");
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: queryError } = await supabase
          .from('entity_revisions')
          .select(`
            id,
            created_at,
            data,
            submitter_user:users!entity_revisions_submitter_id_fkey(full_name, email),
            approver_user:users!entity_revisions_approver_id_fkey(full_name, email)
          `)
          .eq('entity_id', politicianId)
          .eq('entity_type', 'Politician')
          .order('created_at', { ascending: false });

        if (queryError) {
          throw queryError;
        }
        setRevisions(data || []);
      } catch (e: any) {
        console.error("Error fetching edit history:", e);
        setError(e.message || "Failed to fetch edit history.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [politicianId]);

  const getDisplayName = (user: { full_name: string | null; email: string | null } | null): string => {
    if (!user) return "System/Unknown";
    return user.full_name || user.email || "Unknown User";
  };

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-2/3" />
      </div>
    );
  }

  if (error) {
    return (
       <Alert variant="destructive" className="mt-4">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (revisions.length === 0) {
    return (
      <p className="text-muted-foreground italic py-4 mt-4">
        No edit history available for this profile.
      </p>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {revisions.map((revision) => (
        <div key={revision.id} className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
            <p className="text-sm font-semibold text-primary">
              Revision: {format(new Date(revision.created_at), "PPPp")}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setSelectedSnapshot(revision.data)}>
                  View Snapshot
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
          <p className="text-xs text-muted-foreground">
            Approved by: {getDisplayName(revision.approver_user)}
          </p>
          <p className="text-xs text-muted-foreground">
            Proposed by: {getDisplayName(revision.submitter_user)}
          </p>
          {/* 
            Future enhancement: Show a summary of changes.
            For V1, just "Profile updated" is implicit.
            Could add a "change_reason" if it was stored with the revision.
          */}
        </div>
      ))}
      {selectedSnapshot && (
        <Dialog open={!!selectedSnapshot} onOpenChange={(isOpen) => !isOpen && setSelectedSnapshot(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Data Snapshot</DialogTitle>
              <DialogDescription>
                This is the complete data snapshot for this revision.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] mt-4 p-1 bg-secondary rounded-md">
              <pre className="text-xs whitespace-pre-wrap break-all p-4">
                {JSON.stringify(selectedSnapshot, null, 2)}
              </pre>
            </ScrollArea>
            <DialogFooter className="mt-4">
                <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EditHistory;
