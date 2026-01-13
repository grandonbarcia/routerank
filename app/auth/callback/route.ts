import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  // If we have a code, exchange it for a session
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    // Redirect to a success page (without code param) to avoid reprocessing
    return NextResponse.redirect(`${origin}/auth/callback/success`);
  }

  // If no code, redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
