import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const isProtectedPath = (pathname: string) =>
    /^\/(dashboard|scan|settings|history)(\/|$)/.test(pathname);

  const pendingCookiesToSet: Array<{
    name: string;
    value: string;
    options: Parameters<NextResponse['cookies']['set']>[2];
  }> = [];

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          cookies.forEach(({ name, value, options }) => {
            pendingCookiesToSet.push({ name, value, options });
          });
        },
      },
    }
  );

  // This refreshes a user's session in case they have one
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (isProtectedPath(request.nextUrl.pathname) && !session) {
    const redirectResponse = NextResponse.redirect(
      new URL('/login', request.url)
    );

    pendingCookiesToSet.forEach(({ name, value, options }) => {
      redirectResponse.cookies.set(name, value, options);
    });

    return redirectResponse;
  }

  return response;
}
