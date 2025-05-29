
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, Bell, User, LogIn, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarGroup,
  SidebarGroupLabel
} from '@/components/ui/sidebar';
import { NetrikaLogo } from '@/components/icons/logo';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: React.ElementType;
  requiresAuth?: boolean;
  isExact?: boolean;
  badgeCount?: number;
}

const mainNavItems: NavItem[] = [
  { id: 'home', href: '/', label: 'Home', icon: Home, isExact: true },
  { id: 'search', href: '/search', label: 'Search', icon: Search },
  { id: 'following', href: '/following', label: 'Following', icon: Heart, requiresAuth: true },
  { id: 'notifications', href: '/notifications', label: 'Notifications', icon: Bell, requiresAuth: true, badgeCount: 3 }, // Placeholder badge
];

// This function is now only used to define the shape for an authenticated user in the footer
const accountProfileItem = (user: ReturnType<typeof useAuth>['user']): NavItem => ({
  id: 'profile',
  href: '/profile',
  label: user?.name || 'Profile',
  icon: User,
});


export function SideNav() {
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading: authIsLoading } = useAuth();
  // const notificationCount = 3; // Placeholder - already exists in mainNavItems

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const currentProfileDetails = isAuthenticated && user ? accountProfileItem(user) : null;

  const allNavItems = [
    ...mainNavItems.filter(item => !item.requiresAuth || isAuthenticated),
  ];


  return (
    <Sidebar
      variant="sidebar" // Standard sidebar behavior
      collapsible="icon" // Collapses to icons
      className="hidden border-r bg-sidebar text-sidebar-foreground md:flex" // Desktop only
    >
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <NetrikaLogo className="h-8 w-auto group-data-[collapsible=icon]:h-7" />
          <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">Netrika</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {allNavItems.map((item) => {
            const isActive = item.isExact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={{ children: item.label, side: 'right', align: 'center' }}
                >
                  <Link href={item.href}>
                    <item.icon className={cn(isActive && "text-sidebar-primary-foreground")} />
                    <span>{item.label}</span>
                    {item.badgeCount && item.badgeCount > 0 && (
                      <SidebarMenuBadge>{item.badgeCount}</SidebarMenuBadge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-sidebar-border">
          {authIsLoading ? (
            <div className="flex items-center gap-3 p-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="group-data-[collapsible=icon]:hidden flex-1 space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          ) : isAuthenticated && user && currentProfileDetails ? (
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(currentProfileDetails.href)}
              className="justify-start w-full"
              tooltip={{ children: currentProfileDetails.label, side: 'right', align: 'center' }}
            >
              <Link href={currentProfileDetails.href} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.name || 'User'} data-ai-hint="user avatar" />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
                  <span className="block truncate font-medium">{currentProfileDetails.label}</span>
                  {user.email && (
                    <span className="block truncate text-xs text-sidebar-foreground/70">{user.email}</span>
                  )}
                </div>
              </Link>
            </SidebarMenuButton>
          ) : (
            // If not loading and not authenticated, display nothing in the footer user slot.
            // The Header component handles the main login/signup CTA.
            // You could put a placeholder here if desired, e.g., a generic app icon or empty space.
            // For now, it will be empty, making the footer potentially shorter when logged out.
            <div className="h-[52px] group-data-[collapsible=icon]:h-12"></div> // Placeholder to maintain footer height similar to logged-in state
          )}
      </SidebarFooter>
    </Sidebar>
  );
}
