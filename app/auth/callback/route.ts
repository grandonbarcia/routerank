import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (!code) {
    console.log('No code in callback, redirecting to login');
    return NextResponse.redirect(`${origin}/login`);
  }

  console.log('Processing OAuth callback with code');

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  console.log('Session exchanged successfully for user:', data.user?.email);

  // Redirect to success page
  const response = NextResponse.redirect(`${origin}/auth/callback/success`);

  // Ensure cookies are set with proper attributes
  response.headers.set('Cache-Control', 'no-store, max-age=0');

  return response;
}
