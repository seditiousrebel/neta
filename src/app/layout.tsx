
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Header } from '@/components/header';
import { BottomNav } from '@/components/bottom-nav';
import { SideNav } from '@/components/navigation/SideNav';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import QueryProvider from '@/components/providers/QueryProvider'; // New

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Netrika - Political Transparency Platform',
  description: 'Track politicians, parties, promises, and legislative bills. Your source for political accountability.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "antialiased font-sans"
        )}
      >
        <AuthProvider>
          <QueryProvider> {/* TanStack Query Provider */}
            <SidebarProvider defaultOpen={true}> {/* Sidebar open by default on desktop */}
              <div className="relative flex min-h-screen w-full bg-background">
                <SideNav />
                <SidebarInset className="flex flex-1 flex-col"> {/* Main content area that adapts to sidebar */}
                  <Header />
                  <main className="flex-grow overflow-y-auto p-4 pb-20 md:pb-4 md:p-6"> {/* Padding for content, pb for BottomNav on mobile */}
                    {children}
                  </main>
                </SidebarInset>
              </div>
              <BottomNav /> {/* Fixed at bottom for mobile, hidden on desktop */}
              <Toaster />
            </SidebarProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
