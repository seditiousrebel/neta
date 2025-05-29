
"use client";

import Link from 'next/link';
import { NetrikaLogo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { LogIn, LogOut, User as UserIcon, Settings, ShieldCheck, Menu } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function Header() {
  const { 
    isAuthenticated, 
    user, 
    logout, 
    isLoading: authIsLoading,
  } = useAuth();
  
  const getInitials = (name?: string | null) => {
    if (!name) return 'N'; 
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2) || 'U';
  }

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            {/* SidebarTrigger for desktop collapsing, and for mobile off-canvas if SideNav is configured for it */}
            <SidebarTrigger className="h-8 w-8 md:hidden group-data-[sidebar-variant=floating]/sidebar-wrapper:md:flex group-data-[sidebar-variant=inset]/sidebar-wrapper:md:flex" />
             {/* This specific SidebarTrigger setup for md:hidden ensures it's for mobile primarily if sidebar is configured to be off-canvas on mobile.
                 The shadcn-sidebar itself handles its desktop collapse trigger internally if `collapsible="icon"` is set on <Sidebar />
                 However, adding a manual trigger here is also fine. Let's simplify the trigger logic.
                 The SidebarTrigger from ui/sidebar should work universally based on SidebarProvider context.
             */}
            <SidebarTrigger className={cn(
              "h-8 w-8",
              // Hide if sidebar is not collapsible or if sidebar is 'offcanvas' (mobile sheet) and screen is desktop
              // "group-data-[sidebar-collapsible=none]/sidebar-wrapper:hidden",
              // "group-data-[sidebar-collapsible=offcanvas]/sidebar-wrapper:md:hidden" 
              // For now, let this trigger be for desktop expand/collapse mainly
            )} />

            <Link href="/" className="hidden items-center sm:flex" aria-label="Netrika Home">
              <NetrikaLogo className="h-8 w-auto" />
            </Link>
          </div>
          
          <Link href="/" className="flex items-center sm:hidden" aria-label="Netrika Home"> {/* Mobile Logo */}
            <NetrikaLogo className="h-7 w-auto" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {authIsLoading ? (
              <Skeleton className="h-10 w-10 rounded-full" />
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.name || 'User'} data-ai-hint="person avatar" />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                       {user.role && (
                        <p className="text-xs leading-none text-muted-foreground flex items-center pt-1">
                          <ShieldCheck className="mr-1 h-3 w-3 text-primary" /> {user.role}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserIcon className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings (coming soon)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/auth/login">
                  <LogIn className="mr-0 h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Login / Sign Up</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
