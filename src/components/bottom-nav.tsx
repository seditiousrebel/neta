
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, Bell, User, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton'; // Added for loading state

const baseNavItems = [
  { id: 'home', href: '/', label: 'Home', icon: Home, requiresAuth: false },
  { id: 'search', href: '/search', label: 'Search', icon: Search, requiresAuth: false },
  { id: 'following', href: '/following', label: 'Following', icon: Heart, requiresAuth: true }, // Typically requires auth
  { id: 'notifications', href: '/notifications', label: 'Notifications', icon: Bell, requiresAuth: true }, // Typically requires auth
  // Profile/Login slot is handled dynamically
];

export function BottomNavigation() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authIsLoading, openLoginModal } = useAuth();

  const authNavItem = authIsLoading 
    ? { id: 'auth-loading', label: 'Loading', icon: null, isAction: false, action: () => {} }
    : isAuthenticated
    ? { id: 'profile', href: '/profile', label: 'Profile', icon: User, isAction: false, action: () => {} }
    : { id: 'login', label: 'Login', icon: LogIn, isAction: true, action: openLoginModal };
  
  const navItems = [...baseNavItems, authNavItem];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="container mx-auto grid h-full max-w-lg grid-cols-5 items-center px-2">
        {navItems.map((item) => {
          if (item.id === 'auth-loading' && item.icon === null) { // Special handling for loading skeleton
            return (
              <div key={item.id} className="inline-flex flex-col items-center justify-center p-2">
                <Skeleton className="h-6 w-6 mb-0.5 rounded-md" />
                <Skeleton className="h-3 w-10 rounded-sm" />
              </div>
            );
          }

          const IconComponent = item.icon!;
          const isActive = !item.isAction && pathname === item.href;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={cn(
                  "inline-flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
                aria-label={item.label}
              >
                <IconComponent className="h-6 w-6 mb-0.5" strokeWidth={2} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href!}
              className={cn(
                "inline-flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <IconComponent className={cn("h-6 w-6 mb-0.5", isActive && "fill-current")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
