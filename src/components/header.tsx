
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
import { LogIn, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { 
    isAuthenticated, 
    user, 
    login: performAuthLogin, 
    logout, 
    isLoading: authIsLoading,
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal
  } = useAuth();
  
  const [username, setUsername] = useState('');
  const { toast } = useToast();

  const handleLogin = async () => {
    if (username.trim()) {
      try {
        await performAuthLogin(username.trim());
        // Toast for success/failure is handled within authContext's login
        closeLoginModal(); // Close modal on successful login/signup attempt
        setUsername('');
      } catch (error) {
        // This catch is a fallback, primary error handling (toast) is in authContext.login
        console.error("Login process error in header:", error);
        // toast({ title: "Login Error", description: "An unexpected error occurred.", variant: "destructive" });
        // Decide if modal should close on error, or allow retry. For now, it stays open.
      }
    } else {
      toast({ title: "Validation Error", description: "Username cannot be empty.", variant: "destructive" });
    }
  };
  
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
                      <AvatarImage src={user.avatarUrl || ''} alt={user.name || 'User'} data-ai-hint="person avatar" />
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
              <Button onClick={openLoginModal} variant="outline">
                <LogIn className="mr-2 h-4 w-4" />
                Login / Sign Up
              </Button>
            )}
          </div>
        </div>
      </header>

      <Dialog open={isLoginModalOpen} onOpenChange={(open) => { if (!open) closeLoginModal(); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Login or Sign Up</DialogTitle>
            <DialogDescription>
              Enter a username. If you're new, an account will be created.
              <br />
              <span className="text-xs text-muted-foreground">
                (Email: `username@example.com`, Password: `password123`. For prototype only.)
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="col-span-3"
                placeholder="E.g. JaneDoe"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeLoginModal}>Cancel</Button>
            <Button type="submit" onClick={handleLogin} disabled={!username.trim() || authIsLoading}>
              {authIsLoading ? "Processing..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
