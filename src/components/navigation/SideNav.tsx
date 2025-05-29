
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, Bell, Users, LogIn } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Button } from '@/components/ui/button'; // No longer used for login button here
// import { NetrikaLogo } from '@/components/icons/logo'; // Logo removed from SideNav header in previous step

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
  { id: 'politicians', href: '/politicians', label: 'Politicians', icon: Users },
  { id: 'following', href: '/following', label: 'Following', icon: Heart, requiresAuth: true },
  { id: 'notifications', href: '/notifications', label: 'Notifications', icon: Bell, requiresAuth: true, badgeCount: 3 },
];

const getInitials = (name?: string | null) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
};

export function SideNav() {
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading: authIsLoading } = useAuth();

  const allNavItems = mainNavItems.filter(item => !item.requiresAuth || isAuthenticated);

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="hidden border-r bg-sidebar text-sidebar-foreground md:flex"
    >
      <SidebarHeader className="p-4 h-[64px] flex items-center justify-center">
        {/* Logo was removed from here previously */}
         <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          {/* <NetrikaLogo className="h-8 w-auto group-data-[collapsible=icon]:h-7" /> */}
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
              </div>
            </div>
          ) : isAuthenticated && user ? (
             <SidebarMenuItem className="mt-auto">
                <SidebarMenuButton
                    asChild
                    className="justify-start w-full"
                    tooltip={{
                        children: (
                        <div className="flex flex-col items-start">
                            <span className="font-medium">{user.name || 'User'}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                        ),
                        side: 'right',
                        align: 'center',
                    }}
                    >
                    <Link href="/profile" className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7">
                            <AvatarImage src={user.avatarUrl || undefined} alt={user.name || 'User'} data-ai-hint="user avatar" />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
                            <span className="block truncate font-medium">{user.name || 'User'}</span>
                        </div>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
             <SidebarMenuItem className="mt-auto">
                <SidebarMenuButton
                    asChild
                    className="justify-start w-full"
                    tooltip={{ children: 'Login', side: 'right', align: 'center' }}
                    >
                    <Link href="/auth/login" className="flex items-center gap-2 pl-1"> {/* Adjusted gap and padding slightly */}
                        {/* <LogIn className="h-5 w-5" /> Removed LogIn icon */}
                        <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
                        <span className="block truncate font-medium">Login</span>
                        </div>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          )}
      </SidebarFooter>
    </Sidebar>
  );
}
