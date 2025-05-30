
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, FileText, Edit, BarChart3, AlertTriangle, MessageSquare, Library } from "lucide-react"; // Added Library icon

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview and quick actions for site management.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"> {/* Updated to lg:grid-cols-4 */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Registered users (placeholder)</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Edits</CardTitle>
            <Edit className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Require review (placeholder)</p>
             <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link href="/admin/moderation">Review Edits</Link> {/* Corrected Link */}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reported Content</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Needs immediate attention (placeholder)</p>
            <Button variant="destructive" size="sm" className="mt-2" asChild>
                <Link href="/admin/moderation">View Reports</Link> {/* Corrected Link, user will select tab */}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow"> {/* New Card */}
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Site Content</CardTitle>
            <Library className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,678</div> {/* Placeholder */}
            <p className="text-xs text-muted-foreground">Politicians, parties, etc. (placeholder)</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">Quick Links</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/moderation" className="block p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm">
            <div className="flex items-center gap-3 mb-1">
                <Edit className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Content Moderation</h3>
            </div>
            <p className="text-sm text-muted-foreground">Approve or deny pending edits, manage flags.</p>
          </Link>
           <Link href="/admin/users" className="block p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm">
             <div className="flex items-center gap-3 mb-1">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">User Management</h3>
            </div>
            <p className="text-sm text-muted-foreground">View users, manage roles and permissions.</p>
          </Link>
           <Link href="/admin/analytics" className="block p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm">
             <div className="flex items-center gap-3 mb-1">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Site Analytics</h3>
            </div>
            <p className="text-sm text-muted-foreground">View traffic, content engagement, etc.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
