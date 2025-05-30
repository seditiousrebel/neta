// src/app/admin/moderation/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, ShieldAlert, MessageSquare, CheckCircle, XCircle, UserCircle, UserCheck } from "lucide-react"; // Added UserCheck
import { getPendingEdits } from "@/lib/supabase/admin";
import type { AdminPendingEdit } from "@/types/entities";
import { Badge } from "@/components/ui/badge";
import { ViewEditDetails } from "@/components/admin/moderation/ViewEditDetails";
import { denyPendingEditAction, approvePendingEditAction } from "@/lib/actions/moderation.actions"; 
import { Input } from "@/components/ui/input"; // Added Input

// Helper function to format date (remains as is)
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

// Server actions (remain as is)
const denyAction = async (formData: FormData) => {
  "use server";
  const editId = Number(formData.get("editId"));
  if (!editId) return; 
  const result = await denyPendingEditAction(editId); 
  if (!result.success) {
      console.error("Failed to deny edit:", result.error);
  }
};

const approveAction = async (formData: FormData) => {
  "use server";
  const editId = Number(formData.get("editId"));
  if (!editId) return;
  const result = await approvePendingEditAction(editId); 
  if (!result.success) {
      console.error("Failed to approve edit:", result.error);
  }
};

export default async function ModerationPage({
  searchParams,
}: {
  searchParams?: {
    page?: string; // For general pending edits pagination
    politicianPage?: string; // For politician edits pagination
    politicianSearch?: string; // For searching politician edits
  };
}) {
  const currentPage = Number(searchParams?.page) || 1;
  const currentPoliticianPage = Number(searchParams?.politicianPage) || 1;
  const politicianSearchQuery = searchParams?.politicianSearch || '';

  // Fetch general pending edits
  const { edits: pendingEdits, count: totalPendingEdits } = await getPendingEdits({ page: currentPage });

  // Fetch politician-specific pending edits
  const { edits: pendingPoliticianEdits, count: totalPoliticianEdits } = await getPendingEdits({ 
    page: currentPoliticianPage, 
    entityType: 'Politician',
    // searchQuery: politicianSearchQuery, // Full search implementation is a future step
  });
  
  // Helper function to get proposer info (remains as is)
  const getProposerInfo = (edit: AdminPendingEdit) => {
    if (edit.users) {
      return edit.users.full_name || edit.users.email || edit.proposer_id;
    }
    return edit.proposer_id;
  };

  return (
    <div className="space-y-8 p-4 md:p-6"> {/* Added some padding */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Content Moderation</h1>
        <p className="text-muted-foreground">Review pending edits, manage reported content, and view audit logs.</p>
      </header>

      <Tabs defaultValue="pending-edits" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-6"> {/* Adjusted grid cols */}
          <TabsTrigger value="pending-edits">
            <Edit className="mr-2 h-4 w-4" /> General Edits {totalPendingEdits ? `(${totalPendingEdits})` : ''}
          </TabsTrigger>
          <TabsTrigger value="pending-politician-edits">
            <UserCheck className="mr-2 h-4 w-4" /> Politician Edits {totalPoliticianEdits ? `(${totalPoliticianEdits})` : ''}
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
              <CardTitle>Pending General Edits</CardTitle>
              <CardDescription>Review and approve or deny user-submitted content changes for various entities.</CardDescription>
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
                            <Button type="submit" variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-100" title="Approve">
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
                  No general pending edits to review at this time.
                </p>
              )}
              {/* TODO: Add pagination for general edits using 'page' searchParam */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending-politician-edits">
          <Card>
            <CardHeader>
              <CardTitle>Pending Politician Edits</CardTitle>
              <CardDescription>Review and approve or deny user-submitted politician profiles.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                <form className="w-full sm:max-w-sm">
                  <Input 
                    type="search" 
                    placeholder="Search by politician name..."
                    name="politicianSearch"
                    defaultValue={politicianSearchQuery} 
                  />
                  {/* Example: <Button type="submit">Search</Button> */}
                </form>
                {/* Placeholder for Date Filter Button - functionality to be implemented 
                <div className="flex space-x-2">
                  <Button variant="outline">Date Range <CalendarDays className="ml-2 h-4 w-4" /></Button>
                </div>
                */}
              </div>

              {pendingPoliticianEdits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proposer</TableHead>
                      <TableHead>Politician Name (from data)</TableHead>
                      <TableHead>Change Reason</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPoliticianEdits.map((edit) => (
                      <TableRow key={edit.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-5 w-5 text-muted-foreground" />
                            {getProposerInfo(edit)}
                          </div>
                        </TableCell>
                        <TableCell>
                           {edit.proposed_data?.name || <span className="text-muted-foreground italic">N/A</span>}
                           <div><Badge variant="secondary" className="mt-1">{edit.entity_type}</Badge></div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={edit.change_reason || undefined}>
                          {edit.change_reason || <span className="text-muted-foreground italic">No reason</span>}
                        </TableCell>
                        <TableCell>{formatDate(edit.created_at)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          {/* For Politician edits, PoliticianReview will be used in a later step */}
                          <ViewEditDetails edit={edit} /> 
                          <form action={approveAction} className="inline-block">
                            <input type="hidden" name="editId" value={edit.id} />
                            <Button type="submit" variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-100" title="Approve">
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
                  No pending politician edits to review at this time.
                </p>
              )}
              {/* TODO: Add pagination for politician edits using 'politicianPage' searchParam */}
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
              <p className="text-muted-foreground text-center py-8">
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
              <p className="text-muted-foreground text-center py-8">
                Audit log entries will appear here. (Functionality to be implemented)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
