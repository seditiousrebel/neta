
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

interface ViewEditDetailsProps {
  edit: AdminPendingEdit;
}

export function ViewEditDetails({ edit }: ViewEditDetailsProps) {
  const getProposerInfo = (edit: AdminPendingEdit) => {
    if (edit.users) {
      return edit.users.full_name || edit.users.email || edit.proposer_id;
    }
    return edit.proposer_id;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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
            Proposed by: {getProposerInfo(edit)} on {formatDate(edit.created_at)}
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

            {/* Placeholder for showing diff if applicable */}
            {/* 
            <div>
              <h4 className="font-semibold mb-1 text-sm">Data Diff (Current vs Proposed):</h4>
              <pre className="p-3 bg-muted/80 rounded-md text-xs overflow-x-auto max-h-96">
                // Diff logic would go here
                // For example, showing what changed from the original record
                {`Original: ${JSON.stringify({ some_field: "old_value" }, null, 2)}\nProposed: ${JSON.stringify(edit.proposed_data, null, 2)}`}
              </pre>
            </div>
            */}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
           <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
          {/* Placeholder actions - implement with server actions */}
          <Button variant="destructive" disabled>
            <XCircle className="mr-2 h-4 w-4" /> Deny (Not Implemented)
          </Button>
          <Button variant="default" disabled>
            <CheckCircle className="mr-2 h-4 w-4" /> Approve (Not Implemented)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
