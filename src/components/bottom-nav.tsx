
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, Bell, User, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: React.ElementType;
  requiresAuth?: boolean;
  showBadge?: boolean; // For notifications
}

const navItemsList: NavItem[] = [
  { id: 'home', href: '/', label: 'Home', icon: Home },
  { id: 'search', href: '/search', label: 'Search', icon: Search },
  { id: 'following', href: '/following', label: 'Following', icon: Heart, requiresAuth: true },
  { id: 'notifications', href: '/notifications', label: 'Notifications', icon: Bell, requiresAuth: true, showBadge: true },
  // Profile/Login is handled dynamically
];

export function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuth();
  const notificationCount = 3; // Placeholder for actual notification count

  const getNavItems = () => {
    const filteredItems = navItemsList.filter(item => !item.requiresAuth || isAuthenticated);

    let authNavItem: NavItem | { id: string, label: string, icon: null, isSkeleton: true };

    if (authIsLoading) {
      authNavItem = { id: 'auth-loading', label: 'Loading', icon: null, isSkeleton: true };
    } else if (isAuthenticated) {
      authNavItem = { id: 'profile', href: '/profile', label: 'Profile', icon: User };
    } else {
      authNavItem = { id: 'login', href: '/auth/login', label: 'Login', icon: LogIn };
    }
    return [...filteredItems, authNavItem];
  };

  const currentNavItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="container mx-auto grid h-full max-w-lg grid-cols-5 items-center px-2">
        {currentNavItems.map((item) => {
          if ('isSkeleton' in item && item.isSkeleton) {
            return (
              <div key={item.id} className="inline-flex flex-col items-center justify-center p-2 h-[44px] w-full">
                <Skeleton className="h-6 w-6 mb-0.5 rounded-md" />
                <Skeleton className="h-3 w-10 rounded-sm" />
              </div>
            );
          }
          
          const navItem = item as NavItem;
          const IconComponent = navItem.icon!;
          const isActive = pathname === navItem.href;

          return (
            <Link
              key={navItem.id}
              href={navItem.href!}
              className={cn(
                "relative inline-flex flex-col items-center justify-center p-2 rounded-lg transition-colors h-[44px] w-full", // Ensure min tap target
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <IconComponent className={cn("h-6 w-6 mb-0.5", isActive && "fill-primary")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{navItem.label}</span>
              {navItem.showBadge && notificationCount > 0 && isAuthenticated && (
                <Badge
                  variant="destructive"
                  className="absolute top-1 right-1 h-4 min-w-[1rem] p-0.5 text-xs leading-none flex items-center justify-center"
                >
                  {notificationCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
