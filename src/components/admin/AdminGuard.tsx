
"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        toast({
            title: "Authentication Required",
            description: "Please log in to access this area.",
            variant: "destructive",
        });
        router.push('/auth/login?next=/admin');
      } else if (user?.role !== 'Admin') { // <<< CHANGED BACK to 'Admin'
        toast({
            title: "Access Denied",
            description: "You do not have permission to view this page.",
            variant: "destructive",
        });
        router.push('/'); // Redirect to home page or a specific unauthorized page
      }
    }
  }, [isAuthenticated, isLoading, user, router, toast]);

  if (isLoading || !isAuthenticated || user?.role !== 'Admin') { // <<< CHANGED BACK to 'Admin'
    // Show a loading skeleton or a generic access verification message
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="flex flex-col items-center p-8 border rounded-lg shadow-xl bg-card">
            {isLoading ? (
                <>
                    <Skeleton className="w-16 h-16 mb-4 rounded-full" />
                    <Skeleton className="w-48 h-6 mb-2" />
                    <Skeleton className="w-32 h-4" />
                    <p className="mt-4 text-sm text-muted-foreground">Verifying admin access...</p>
                </>
            ) : (
                 <>
                    <ShieldAlert className="w-16 h-16 mb-4 text-destructive" />
                    <h2 className="text-xl font-semibold text-destructive">Access Denied</h2>
                    <p className="mt-2 text-sm text-center text-muted-foreground">
                        You do not have the necessary permissions to view this page.
                        Redirecting...
                    </p>
                </>
            )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
