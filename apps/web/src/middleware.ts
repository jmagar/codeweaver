import { NextResponse, type NextRequest } from 'next/server';
import { auth } from 'next-auth';

// Wrap our custom logic around the built-in auth middleware
export default function middleware(req: NextRequest) {
  // First let NextAuth handle authentication / session
  const result = auth(req);

  // Apply security headers
  result.headers.set('X-Frame-Options', 'DENY');
  result.headers.set('X-Content-Type-Options', 'nosniff');
  result.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  result.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  return result;
}

export const config = {
  matcher: ['/api/protected/:path*', '/dashboard/:path*'],
};