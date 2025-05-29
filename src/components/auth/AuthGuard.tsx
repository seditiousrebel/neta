
// src/components/auth/AuthGuard.tsx
"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton'; // For a loading state

interface AuthGuardProps {
  children: ReactNode;
  /** List of roles allowed to access this route. If undefined, only authentication is checked. */
  allowedRoles?: string[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        const loginUrl = new URL('/auth/login', window.location.origin);
        loginUrl.searchParams.set('next', pathname);
        router.push(loginUrl.toString());
      } else if (allowedRoles && user?.role && !allowedRoles.includes(user.role as string)) {
        // User is authenticated but does not have the required role
        // Redirect to an unauthorized page or home
        toast({
            title: "Access Denied",
            description: "You do not have permission to view this page.",
            variant: "destructive",
        });
        router.push('/'); // Or a specific '/unauthorized' page
      }
    }
  }, [isAuthenticated, isLoading, router, pathname, allowedRoles, user?.role]);

  if (isLoading || !isAuthenticated) {
    // Show a loading skeleton or spinner while checking auth state or redirecting
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Skeleton className="h-12 w-12 rounded-full mb-4" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3" />
        <p className="mt-4 text-sm text-muted-foreground">Loading & Verifying Access...</p>
      </div>
    );
  }
  
  // If authenticated and (no specific roles required OR user has one of the allowed roles)
  if (isAuthenticated && (!allowedRoles || (user?.role && allowedRoles.includes(user.role as string)))) {
    return <>{children}</>;
  }

  // Fallback if somehow conditions above aren't met before redirect effect (e.g. role check fails after initial auth pass)
  // This also acts as a loading state for the role check specifically if isAuthenticated but role check is pending
   return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Skeleton className="h-12 w-12 rounded-full mb-4" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3" />
        <p className="mt-4 text-sm text-muted-foreground">Verifying access...</p>
      </div>
    );
}

// Helper function to display toast (assuming useToast is not directly usable in AuthGuard context like this)
// You might need to adapt this or use a global toast instance if useToast can't be called here.
// For simplicity, this is a placeholder. Toasts are better handled in page components or context.
const toast = (options: { title: string, description: string, variant?: "default" | "destructive" }) => {
    console.warn(`Toast from AuthGuard (should be improved): ${options.title} - ${options.description}`);
};

