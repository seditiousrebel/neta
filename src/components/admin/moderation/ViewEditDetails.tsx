
"use client";

import type { AdminPendingEdit } from "@/types/entities";
import { Button } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { UserCircle, Edit, CheckCircle, XCircle } from "lucide-react";
import { denyPendingEditAction, approvePendingEditAction } from "@/lib/actions/moderation.actions";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";


interface ViewEditDetailsProps {
  edit: AdminPendingEdit;
}

export function ViewEditDetails({ edit }: ViewEditDetailsProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getProposerInfo = (edit: AdminPendingEdit) => {
    if (edit.users) {
      return edit.users.full_name || edit.users.email || edit.proposer_id;
    }
    return edit.proposer_id;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleDeny = async () => {
    setIsSubmitting(true);
    const result = await denyPendingEditAction(edit.id);
    if (result.success) {
      toast({ title: "Edit Denied", description: result.message || "The pending edit has been denied." });
      // Optionally close dialog or trigger refresh through other means if revalidatePath isn't immediate
    } else {
      toast({ title: "Error", description: result.error || "Failed to deny edit.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    const result = await approvePendingEditAction(edit.id); 
    if (result.success) {
      toast({ title: "Edit Approved", description: result.message || "The pending edit has been approved." });
    } else {
      toast({ title: "Error Approving", description: result.error || "Failed to approve edit.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };


  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-3.5 w-3.5" /> View
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Edit className="mr-2 h-5 w-5 text-primary" />
            Review Pending Edit: <Badge variant="secondary" className="ml-2">{edit.entity_type}</Badge>
          </DialogTitle>
          <DialogDescription>
            Proposer ID: {edit.proposer_id} (Name: {getProposerInfo(edit)}) on {formatDate(edit.created_at)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-6">
          <div className="grid gap-4 py-4">
            {edit.change_reason && (
              <div className="mb-4">
                <h4 className="font-semibold mb-1 text-sm">Change Reason:</h4>
                <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md whitespace-pre-wrap">
                  {edit.change_reason}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-semibold mb-1 text-sm">Proposed Data:</h4>
              <pre className="p-3 bg-muted/80 rounded-md text-xs overflow-x-auto max-h-96">
                {JSON.stringify(edit.proposed_data, null, 2)}
              </pre>
            </div>
            
            {edit.entity_id && (
                 <div>
                    <h4 className="font-semibold mb-1 text-sm">Target Entity ID:</h4>
                    <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                        {edit.entity_id}
                    </p>
                </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
           <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Close
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDeny} disabled={isSubmitting}>
            <XCircle className="mr-2 h-4 w-4" /> {isSubmitting ? "Denying..." : "Deny"}
          </Button>
          <Button variant="default" onClick={handleApprove} disabled={isSubmitting}> 
            <CheckCircle className="mr-2 h-4 w-4" /> {isSubmitting ? "Approving..." : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
    