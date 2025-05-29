
// src/app/auth/logout/route.ts
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();

  // Attempt to sign out the user
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error during sign out:', error.message);
    // Optionally, redirect to an error page or back to where they were with an error query param
    return NextResponse.redirect(new URL('/?error=signout_failed', req.url), {
      status: 302, // Or handle differently, e.g., return JSON error
    });
  }

  // Redirect to the home page or login page after successful sign out
  return NextResponse.redirect(new URL('/auth/login?message=logged_out', req.url), {
    status: 302,
  });
}
