
"use client";

import Link from 'next/link';
import { NetrikaLogo } from '@/components/icons/logo';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
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
import { LogOut, User as UserIcon, LogIn, Settings, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Helper function to get user initials
const getInitials = (name?: string | null) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
};

export function Header() {
  const { isAuthenticated, user, isLoading: authIsLoading } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <SidebarTrigger className={cn(
              "h-8 w-8",
              "hidden md:flex"
            )} />
            <Link href="/" className="flex items-center" aria-label="Netrika Home">
              <NetrikaLogo className="h-8 w-auto" />
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            {authIsLoading ? (
              <Skeleton className="h-9 w-9 rounded-full sm:w-24" />
            ) : isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9 border">
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.name || 'User'} data-ai-hint="user avatar" />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                       {user.role && (
                        <div className="mt-1 flex items-center text-xs text-muted-foreground">
                          <ShieldCheck className="mr-1.5 h-3 w-3 text-primary" />
                          Role: {user.role}
                        </div>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center cursor-pointer">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {/* Add more items like Settings here if needed */}
                  {/* <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem> */}
                  <DropdownMenuSeparator />
                   <form action="/auth/logout" method="post" className="w-full">
                     <DropdownMenuItem asChild>
                        <button type="submit" className="w-full text-left flex items-center cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log Out</span>
                        </button>
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href="/auth/login">
                  <LogIn className="mr-0 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
