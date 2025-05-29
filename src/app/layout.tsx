
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Header } from '@/components/header';
import { BottomNavigation } from '@/components/bottom-nav';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';

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
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow overflow-y-auto pb-16 md:pb-0 container px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </main>
            <BottomNavigation />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
