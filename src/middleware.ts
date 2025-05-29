
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // To check auth status

const AUTH_PAGES = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/callback'];
const PROTECTED_PAGES = ['/profile', '/following', '/notifications']; // Add more as needed

const isAuthPage = (path: string) => AUTH_PAGES.some(page => path.startsWith(page));
const isProtectedPage = (path: string) => PROTECTED_PAGES.some(page => path.startsWith(page));

export async function middleware(request: NextRequest) {
  // First, update the session for all requests.
  // This is important for keeping the Supabase auth cookie fresh.
  const response = await updateSession(request);

  const supabase = createSupabaseServerClient(); // Use server client for auth check
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;
  const { pathname } = request.nextUrl;

  // If user is authenticated and tries to access auth pages, redirect to home
  if (isAuthenticated && isAuthPage(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not authenticated and tries to access protected pages, redirect to login
  if (!isAuthenticated && isProtectedPage(pathname)) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('next', pathname); // Store intended destination
    return NextResponse.redirect(redirectUrl);
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
