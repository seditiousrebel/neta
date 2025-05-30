
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, ShieldAlert, MessageSquare, CheckCircle, XCircle, UserCircle } from "lucide-react";
import { getPendingEdits } from "@/lib/supabase/admin";
import type { AdminPendingEdit } from "@/types/entities";
import { Badge } from "@/components/ui/badge";
import { ViewEditDetails } from "@/components/admin/moderation/ViewEditDetails";
import { denyPendingEditAction, approvePendingEditAction } from "@/lib/actions/moderation.actions"; // Import actions
import { useToast } from "@/hooks/use-toast"; // To show feedback, but we can't use hooks directly in server components. Feedback must be client-side or via redirects.

export default async function ModerationPage() {
  const { edits: pendingEdits, count: totalPendingEdits } = await getPendingEdits({ page: 1 });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getProposerInfo = (edit: AdminPendingEdit) => {
    if (edit.users) {
      return edit.users.full_name || edit.users.email || edit.proposer_id;
    }
    return edit.proposer_id;
  };

  // Server action needs to be callable from a form
  const denyAction = async (formData: FormData) => {
    "use server";
    const editId = Number(formData.get("editId"));
    if (!editId) return; // Or handle error
    // In a real scenario, you might get a reason from the form too
    const result = await denyPendingEditAction(editId); 
    // Revalidation is handled in the action. For direct feedback, client component + toast is better.
    if (!result.success) {
        console.error("Failed to deny edit:", result.error);
    }
  };
  
  const approveAction = async (formData: FormData) => {
    "use server";
    const editId = Number(formData.get("editId"));
    if (!editId) return;
    const result = await approvePendingEditAction(editId); // Placeholder
    if (!result.success) {
        console.error("Failed to approve edit:", result.error);
    }
  };


  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Content Moderation</h1>
        <p className="text-muted-foreground">Review pending edits, manage reported content, and view audit logs.</p>
      </header>

      <Tabs defaultValue="pending-edits" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-6">
          <TabsTrigger value="pending-edits">
            <Edit className="mr-2 h-4 w-4" /> Pending Edits {totalPendingEdits ? `(${totalPendingEdits})` : ''}
          </TabsTrigger>
          <TabsTrigger value="reported-content">
            <ShieldAlert className="mr-2 h-4 w-4" /> Reported Content
          </TabsTrigger>
          <TabsTrigger value="audit-log">
            <MessageSquare className="mr-2 h-4 w-4" /> Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending-edits">
          <Card>
            <CardHeader>
              <CardTitle>Pending Edits</CardTitle>
              <CardDescription>Review and approve or deny user-submitted content changes.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingEdits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proposer</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Change Reason</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingEdits.map((edit) => (
                      <TableRow key={edit.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-muted-foreground" />
                            {getProposerInfo(edit)}
                          </div>
                        </TableCell>
                        <TableCell>
                           <Badge variant="secondary">{edit.entity_type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={edit.change_reason || undefined}>
                          {edit.change_reason || <span className="text-muted-foreground italic">No reason provided</span>}
                        </TableCell>
                        <TableCell>{formatDate(edit.created_at)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <ViewEditDetails edit={edit} />
                          <form action={approveAction} className="inline-block">
                            <input type="hidden" name="editId" value={edit.id} />
                            <Button type="submit" variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-100" title="Approve" disabled>
                              <CheckCircle className="h-5 w-5" />
                            </Button>
                          </form>
                          <form action={denyAction} className="inline-block">
                            <input type="hidden" name="editId" value={edit.id} />
                            <Button type="submit" variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-100" title="Deny">
                              <XCircle className="h-5 w-5" />
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No pending edits to review at this time.
                </p>
              )}
              {/* TODO: Add pagination if totalPendingEdits > ITEMS_PER_PAGE_ADMIN */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reported-content">
          <Card>
            <CardHeader>
              <CardTitle>Reported Content</CardTitle>
              <CardDescription>Manage content flagged by users for review.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Reported items will be listed here. (Functionality to be implemented)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-log">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Track moderation actions and important site events.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Audit log entries will appear here. (Functionality to be implemented)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    