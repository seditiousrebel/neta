
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
import { LogIn, LogOut, User as UserIcon, Settings, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
// Removed Dialog related imports as login is now a page

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
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center" aria-label="Netrika Home">
            <NetrikaLogo className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
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
              <Button asChild variant="outline">
                <Link href="/auth/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login / Sign Up
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      {/* Login Dialog removed, login is now a dedicated page */}
    </>
  );
}
