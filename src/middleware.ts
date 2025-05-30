
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // To check auth status
import type { Database } from '@/types/supabase'; // Import Database type

const AUTH_PAGES = ['/auth/login', '/auth/register', '/auth/reset-password', '/auth/callback', '/auth/logout'];
const PUBLIC_PAGES = ['/', '/search', '/terms']; // Add any other explicitly public pages
const PROTECTED_PAGES = ['/profile', '/following', '/notifications', '/contribute']; // Add more as needed
const ADMIN_PAGES_PREFIX = '/admin';


const isAuthPage = (path: string) => AUTH_PAGES.some(page => path.startsWith(page));
const isPublicPage = (path: string) => PUBLIC_PAGES.some(page => path === path) || path === '/';
const isProtectedPage = (path: string) => PROTECTED_PAGES.some(page => path.startsWith(page));
const isAdminPage = (path: string) => path.startsWith(ADMIN_PAGES_PREFIX);


export async function middleware(request: NextRequest) {
  // First, update the session for all requests.
  const response = await updateSession(request);

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;
  const { pathname } = request.nextUrl;

  // Allow access to auth pages if not authenticated
  if (isAuthPage(pathname)) {
    if (isAuthenticated && pathname !== '/auth/logout') { // Allow logout even if authenticated
        return NextResponse.redirect(new URL('/', request.url));
    }
    return response; // Allow access to auth pages like login, register
  }

  // Allow access to explicitly public pages
  if (isPublicPage(pathname)) {
    return response;
  }


  // If user is not authenticated and tries to access protected pages (including admin), redirect to login
  if (!isAuthenticated && (isProtectedPage(pathname) || isAdminPage(pathname))) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('next', pathname); // Store intended destination
    return NextResponse.redirect(redirectUrl);
  }

  // If user is authenticated and tries to access admin pages, check role
  if (isAuthenticated && isAdminPage(pathname)) {
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('user_role') // Check user_role
      .eq('id', user.id)
      .single<Pick<Database['public']['Tables']['users']['Row'], 'user_role'>>();

    if (profileError || !userProfile || userProfile.user_role !== 'Admin') { // Check user_role here
      // Not an admin or profile error, redirect to home or an unauthorized page
      console.warn(`User ${user.id} attempted to access admin route ${pathname} without Admin role. Current role: ${userProfile?.user_role}`);
      return NextResponse.redirect(new URL('/', request.url)); // Or a specific /unauthorized page
    }
  }

  // For all other cases (e.g., authenticated user accessing general protected or public pages)
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /terms (terms and conditions page)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|terms|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
