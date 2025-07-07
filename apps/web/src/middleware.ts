import { NextResponse, type NextRequest } from 'next/server';

// Wrap our custom logic around the built-in auth middleware
export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Apply security headers
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  return res;
}

export const config = {
  matcher: ['/api/protected/:path*', '/dashboard/:path*'],
};