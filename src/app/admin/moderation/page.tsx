// src/app/admin/moderation/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, ShieldAlert, MessageSquare, CheckCircle, XCircle, UserCircle, UserCheck } from "lucide-react";
import { getPendingEdits } from "@/lib/supabase/admin";
import type { AdminPendingEdit } from "@/types/entities";
import { Badge } from "@/components/ui/badge";
import { ViewEditDetails } from "@/components/admin/moderation/ViewEditDetails"; 
import { PoliticianReview } from "@/components/admin/politicians/PoliticianReview";
import { denyPendingEditAction, approvePendingEditAction } from "@/lib/actions/moderation.actions"; 
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { revalidatePath } from "next/cache"; // For revalidation from server action

// Helper function to format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

// Server actions for general edits (remain as is for now)
const denyGeneralEdit = async (formData: FormData) => {
  "use server";
  const editId = Number(formData.get("editId"));
  if (!editId) return; 
  const result = await denyPendingEditAction(editId); 
  if (!result.success) {
      console.error("Failed to deny general edit:", result.error);
  } else {
    revalidatePath("/admin/moderation"); // Revalidate this page
  }
};

const approveGeneralEdit = async (formData: FormData) => {
  "use server";
  const editId = Number(formData.get("editId"));
  if (!editId) return;
  const result = await approvePendingEditAction(editId); 
  if (!result.success) {
      console.error("Failed to approve general edit:", result.error);
  } else {
    revalidatePath("/admin/moderation"); // Revalidate this page
  }
};

export default async function ModerationPage({
  searchParams,
}: {
  searchParams?: {
    page?: string; 
    politicianPage?: string;
    politicianSearch?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: "Pending" | "Approved" | "Denied" | "";
    tab?: string; // To keep track of active tab after form submission
  };
}) {
  const currentPage = Number(searchParams?.page) || 1;
  const currentPoliticianPage = Number(searchParams?.politicianPage) || 1;
  const politicianSearchQuery = searchParams?.politicianSearch || "";
  const dateFrom = searchParams?.dateFrom || "";
  const dateTo = searchParams?.dateTo || "";
  const selectedStatus = searchParams?.status || "Pending"; // Default to Pending for politician edits
  const activeTab = searchParams?.tab || "pending-politician-edits"; // Default active tab

  // Fetch general pending edits (these are non-Politician edits)
  const { edits: pendingGeneralEdits, count: totalGeneralPendingEdits } = await getPendingEdits({ 
    page: currentPage, 
    excludeEntityType: 'Politician', // Exclude politician edits from this tab
    status: 'Pending', // Only show pending general edits
  });

  // Fetch politician-specific pending edits with filters
  const politicianEditFilters = {
    page: currentPoliticianPage,
    entityType: 'Politician',
    searchQuery: politicianSearchQuery,
    dateFrom: dateFrom,
    dateTo: dateTo,
    status: selectedStatus,
  };
  const { edits: pendingPoliticianEdits, count: totalPoliticianEdits } = await getPendingEdits(politicianEditFilters);
  
  const getProposerInfo = (edit: AdminPendingEdit) => {
    if (edit.users) {
      return edit.users.full_name || edit.users.email || String(edit.proposer_id);
    }
    return String(edit.proposer_id);
  };

  const handleActionComplete = () => {
    // This function could be used to trigger revalidation if actions don't do it themselves
    // For now, actions use revalidatePath.
    // console.log("Action complete, consider revalidating.");
  };

  return (
    <div className="space-y-8 p-4 md:p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Content Moderation</h1>
        <p className="text-muted-foreground">Review pending edits, manage reported content, and view audit logs.</p>
      </header>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="pending-politician-edits">
            <UserCheck className="mr-2 h-4 w-4" /> Politician Edits {totalPoliticianEdits ? \`(\${totalPoliticianEdits})\` : ''}
          </TabsTrigger>
          <TabsTrigger value="pending-general-edits">
            <Edit className="mr-2 h-4 w-4" /> Other Edits {totalGeneralPendingEdits ? \`(\${totalGeneralPendingEdits})\` : ''}
          </TabsTrigger>
          <TabsTrigger value="reported-content">
            <ShieldAlert className="mr-2 h-4 w-4" /> Reported Content
          </TabsTrigger>
          <TabsTrigger value="audit-log">
            <MessageSquare className="mr-2 h-4 w-4" /> Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending-politician-edits">
          <Card>
            <CardHeader>
              <CardTitle>Pending Politician Edits & Submissions</CardTitle>
              <CardDescription>Review, approve, or deny changes and new additions to politician profiles.</CardDescription>
            </CardHeader>
            <CardContent>
              <form method="GET" action="/admin/moderation" className="mb-6 p-4 border rounded-lg bg-muted/40">
                <input type="hidden" name="tab" value="pending-politician-edits" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div>
                    <Label htmlFor="politicianSearch" className="block text-sm font-medium text-muted-foreground mb-1">Search by Proposed Name</Label>
                    <Input 
                      type="search" 
                      id="politicianSearch"
                      name="politicianSearch"
                      placeholder="Enter proposed name..."
                      defaultValue={politicianSearchQuery} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="status" className="block text-sm font-medium text-muted-foreground mb-1">Status</Label>
                    <Select name="status" defaultValue={selectedStatus}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Denied">Denied</SelectItem>
                        <SelectItem value="">Any Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="dateFrom" className="block text-sm font-medium text-muted-foreground mb-1">Date From</Label>
                    <Input type="date" id="dateFrom" name="dateFrom" defaultValue={dateFrom} />
                  </div>
                  <div>
                    <Label htmlFor="dateTo" className="block text-sm font-medium text-muted-foreground mb-1">Date To</Label>
                    <Input type="date" id="dateTo" name="dateTo" defaultValue={dateTo} />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button type="submit" variant="default">Apply Filters</Button>
                </div>
              </form>

              {pendingPoliticianEdits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proposer</TableHead>
                      <TableHead>Politician Name (Proposed)</TableHead>
                      <TableHead>Type</TableHead>
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
                        </TableCell>
                        <TableCell>
                           <Badge variant={!edit.entity_id ? "default" : "secondary"} className="capitalize">
                             {!edit.entity_id ? "New Submission" : "Update"}
                           </Badge>
                        </TableCell>
                        <TableCell>{formatDate(edit.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <PoliticianReview edit={edit} onActionComplete={handleActionComplete} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No pending politician edits or submissions matching your criteria.
                </p>
              )}
              {/* TODO: Add pagination for politician edits using 'politicianPage' searchParam */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending-general-edits">
          <Card>
            <CardHeader>
              <CardTitle>Pending General Edits</CardTitle>
              <CardDescription>Review and approve or deny user-submitted content changes for various entities (excluding politicians).</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingGeneralEdits.length > 0 ? (
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
                    {pendingGeneralEdits.map((edit) => (
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
                          {edit.change_reason || <span className="text-muted-foreground italic">No reason</span>}
                        </TableCell>
                        <TableCell>{formatDate(edit.created_at)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <ViewEditDetails edit={edit} />
                          <form action={approveGeneralEdit} className="inline-block">
                            <input type="hidden" name="editId" value={edit.id} />
                            <Button type="submit" variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-100/50 dark:hover:bg-green-700/20" title="Approve">
                              <CheckCircle className="h-5 w-5" />
                            </Button>
                          </form>
                          <form action={denyGeneralEdit} className="inline-block">
                            <input type="hidden" name="editId" value={edit.id} />
                            <Button type="submit" variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-red-700/20" title="Deny">
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
              {/* TODO: Add pagination for general edits */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reported-content">
          <Card>
            <CardHeader><CardTitle>Reported Content</CardTitle><CardDescription>Manage content flagged by users.</CardDescription></CardHeader>
            <CardContent><p className="text-muted-foreground text-center py-8">Functionality to be implemented.</p></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-log">
          <Card>
            <CardHeader><CardTitle>Audit Log</CardTitle><CardDescription>Track moderation actions and site events.</CardDescription></CardHeader>
            <CardContent><p className="text-muted-foreground text-center py-8">Functionality to be implemented.</p></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
