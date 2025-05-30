
// src/app/admin/layout.tsx
"use client"; // Make this a client component

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { NetrikaLogo } from '@/components/icons/logo';
import { Home, ShieldCheck, Users, Edit, BarChart3 } from 'lucide-react'; // Added more icons
import { useAuth } from '@/contexts/auth-context'; // Import useAuth
import { Badge } from '@/components/ui/badge'; // For styling the role

// Simple placeholder for admin navigation items
const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: Home },
  { href: '/admin/moderation', label: 'Moderation', icon: Edit },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth(); // Get user and loading state

  return (
    <AdminGuard> {/* AdminGuard will ensure only admins see this layout */}
      <div className="flex min-h-screen bg-muted/40">
        <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r bg-background p-4 md:flex">
          <div className="mb-6 flex items-center gap-2">
            <Link href="/" aria-label="Netrika Home">
                <NetrikaLogo className="h-8 w-auto" />
            </Link>
            <span className="text-sm font-semibold text-primary">Admin Panel</span>
          </div>

          {/* Display User Role Section */}
          <div className="mb-4 p-3 border border-dashed border-accent rounded-lg bg-accent/10 text-center">
            <p className="text-xs text-muted-foreground">Current App Role:</p>
            {authLoading ? (
              <p className="text-sm font-semibold text-accent animate-pulse">Loading...</p>
            ) : (
              <Badge variant={user?.role === 'Admin' ? "destructive" : "secondary"} className="text-sm mt-1"> {/* CHANGED Super Admin to Admin */}
                {user?.role || 'N/A'}
              </Badge>
            )}
          </div>

          <nav className="flex-grow space-y-1">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t pt-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Netrika Admin
            </p>
          </div>
        </aside>
        <main className="flex-1 flex-col p-4 md:p-8">
          {/* Mobile Header (Optional - can be added if needed) */}
          {/* <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent md:hidden">
             Mobile nav trigger, etc.
          </header> */}
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
