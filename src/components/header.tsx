
"use client";

import Link from 'next/link';
import { NetrikaLogo } from '@/components/icons/logo';
import { Menu } from 'lucide-react'; 
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function Header() {
  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            {/* SidebarTrigger for desktop collapsing */}
            <SidebarTrigger className={cn(
              "h-8 w-8",
              // This trigger is primarily for desktop expand/collapse.
              // Mobile navigation is handled by BottomNav.
              "hidden md:flex" 
            )} />

            {/* Updated Link to be always visible */}
            <Link href="/" className="flex items-center" aria-label="Netrika Home">
              <NetrikaLogo className="h-8 w-auto" />
            </Link>
          </div>
          
          {/* Login/Sign Up and User Profile Dropdown have been removed from the header */}
          {/* The right side of the header on desktop is now intentionally empty or can have other global icons if needed later */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-4">
            {/* Placeholder for any future desktop header actions if any. Keep empty for now. */}
          </div>

        </div>
      </header>
    </>
  );
}
