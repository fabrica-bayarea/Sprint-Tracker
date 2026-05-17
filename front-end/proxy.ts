import { NextRequest, NextResponse } from 'next/server'

const isDev = process.env.NODE_ENV === 'development'

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // TODO: Ao implementar TLS, colocar "upgrade-insecure-requests;"
  //
  // Em dev (Turbopack/HMR), o Next injeta scripts inline sem nonce e
  // abre WebSocket pra hot reload. CSP estrito com nonce bloqueia esses
  // scripts e quebra interações (submit do form de login, por exemplo).
  // Por isso afrouxamos script-src e connect-src só em dev.
  // Em prod, mantemos nonce + strict-dynamic + connect-src restrito.
  const cspHeader = isDev
    ? `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' https://fonts.googleapis.com 'unsafe-inline';
      img-src 'self' data: blob:;
      font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com;
      connect-src 'self' ws: wss: http://localhost:3000 http://back:3000;
      frame-ancestors 'self';
      form-action 'self';
      base-uri 'self';
      object-src 'none';
    `
    : `
      default-src 'self';
      script-src 'nonce-${nonce}' 'strict-dynamic';
      style-src 'self' https://fonts.googleapis.com;
      img-src 'self' data:;
      font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com;
      connect-src 'self';
      frame-ancestors 'self';
      form-action 'self';
      base-uri 'self';
      object-src 'none';
    `;
  const sanitizedCspHeader = cspHeader.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const isProtectedRoute = !request.nextUrl.pathname.startsWith('/auth');
  if (isProtectedRoute) {
    const tokenCookie = request.cookies.get('sprinttacker-session');
    if (!tokenCookie?.value) {
      const loginURL = new URL('/auth/login', request.url);
      const redirectResponse = NextResponse.redirect(loginURL);
      redirectResponse.headers.set('Content-Security-Policy', sanitizedCspHeader);
      return redirectResponse;
    }
  }

  const homeToDashboard = request.nextUrl.pathname === '/';
  if (homeToDashboard) {
    const dashboardURL = new URL('/dashboard', request.url);
    const redirectResponse = NextResponse.redirect(dashboardURL);
    redirectResponse.headers.set('Content-Security-Policy', sanitizedCspHeader);
    return redirectResponse;
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set(
    'Content-Security-Policy',
    sanitizedCspHeader
  );

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public|images).*)',
    '/dashboard/:path*',
    '/profile',
  ],
};