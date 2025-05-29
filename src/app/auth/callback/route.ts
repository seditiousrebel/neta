
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/'; // Default redirect to home

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // On successful code exchange, redirect the user.
      // The user is now signed in.
      // The middleware will handle session updates.
      // AuthContext on the client will pick up the new session.
      return NextResponse.redirect(requestUrl.origin + next);
    } else {
      console.error('Auth callback error:', error.message);
      // Redirect to an error page or login page with an error message
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_callback_failed&message=${encodeURIComponent(error.message)}`);
    }
  } else {
    console.error('Auth callback: No code provided.');
    // Redirect to an error page or login page if no code is present
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_code_provided`);
  }
}
