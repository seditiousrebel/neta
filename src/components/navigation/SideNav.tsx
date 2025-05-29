
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, Bell, Settings, LogIn } from 'lucide-react'; // Removed User
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
// Avatar related imports are no longer needed here
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

export function SideNav() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authIsLoading } = useAuth(); // User object no longer needed here

  const allNavItems = mainNavItems.filter(item => !item.requiresAuth || isAuthenticated);

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="hidden border-r bg-sidebar text-sidebar-foreground md:flex"
    >
      <SidebarHeader className="p-4 h-[64px] flex items-center justify-center">
        {/* Logo was removed as per previous request, header can be used for other branding if needed */}
         <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          {/* Placeholder for a small icon/logo when collapsed if desired */}
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
          ) : (
            // Footer is now mostly empty regarding auth.
            // Can be used for things like a settings link or other global actions.
            <div className="h-[52px] flex items-center group-data-[collapsible=icon]:justify-center">
               {/* Example: Add a settings link here in the future if needed 
               <SidebarMenu>
                 <SidebarMenuItem>
                   <SidebarMenuButton
                     asChild
                     className="justify-start w-full"
                     tooltip={{ children: 'Settings', side: 'right', align: 'center' }}
                   >
                     <Link href="/settings" className="flex items-center gap-3">
                       <Settings className="h-5 w-5" />
                       <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
                         <span className="block truncate font-medium">Settings</span>
                       </div>
                     </Link>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
               </SidebarMenu>
               */}
            </div>
          )}
      </SidebarFooter>
    </Sidebar>
  );
}
