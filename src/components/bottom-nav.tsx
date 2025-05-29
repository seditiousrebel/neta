
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, Bell } from 'lucide-react'; // Removed User, LogIn
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
// Skeleton not needed here anymore for the auth item
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
];

export function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth(); // isLoading and user not directly needed for item list
  const notificationCount = 3; // Placeholder for actual notification count

  const currentNavItems = navItemsList.filter(item => !item.requiresAuth || isAuthenticated);
  const gridColsClass = `grid-cols-${currentNavItems.length || 1}`;


  // If there are no items (e.g. not authenticated and all items require auth, though Home/Search don't)
  // we might hide the bottom nav, but current setup ensures at least Home/Search.
  if (currentNavItems.length === 0) {
    return null; 
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className={cn(
          "container mx-auto grid h-full max-w-lg items-center px-2",
          gridColsClass
        )}>
        {currentNavItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "relative inline-flex flex-col items-center justify-center p-2 rounded-lg transition-colors h-[44px] w-full", 
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <IconComponent className={cn("h-6 w-6 mb-0.5", isActive && "fill-primary")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{item.label}</span>
              {item.showBadge && notificationCount > 0 && isAuthenticated && (
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
