import { NextResponse, type NextRequest } from 'next/server';

// Auth removed: no session refresh / route gating.
export function proxy(_request: NextRequest) {
  void _request;
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
