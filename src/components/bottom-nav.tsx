
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, Bell, User, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

const baseNavItems = [
  { id: 'home', href: '/', label: 'Home', icon: Home, requiresAuth: false },
  { id: 'search', href: '/search', label: 'Search', icon: Search, requiresAuth: false },
  { id: 'following', href: '/following', label: 'Following', icon: Heart, requiresAuth: true },
  { id: 'notifications', href: '/notifications', label: 'Notifications', icon: Bell, requiresAuth: true },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authIsLoading } = useAuth();

  const authNavItem = authIsLoading 
    ? { id: 'auth-loading', label: 'Loading', icon: null, isLink: false }
    : isAuthenticated
    ? { id: 'profile', href: '/profile', label: 'Profile', icon: User, isLink: true }
    : { id: 'login', href: '/auth/login', label: 'Login', icon: LogIn, isLink: true };
  
  const navItems = [...baseNavItems, authNavItem];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="container mx-auto grid h-full max-w-lg grid-cols-5 items-center px-2">
        {navItems.map((item) => {
          if (item.id === 'auth-loading' && item.icon === null) {
            return (
              <div key={item.id} className="inline-flex flex-col items-center justify-center p-2">
                <Skeleton className="h-6 w-6 mb-0.5 rounded-md" />
                <Skeleton className="h-3 w-10 rounded-sm" />
              </div>
            );
          }

          const IconComponent = item.icon!;
          const isActive = item.isLink && pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href!}
              className={cn(
                "inline-flex flex-col items-center justify-center p-2 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                // Disable pointer events for auth-loading (not a link)
                item.id === 'auth-loading' && "pointer-events-none" 
              )}
              aria-current={isActive ? "page" : undefined}
              // Prevent click if it's the loading skeleton
              onClick={(e) => { if (item.id === 'auth-loading') e.preventDefault(); }}
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
