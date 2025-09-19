import { NextRequest, NextResponse } from "next/server";

const isDev = process.env.NODE_ENV === "development";

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  // TODO: Ao implementar TLS, colocar "upgrade-insecure-requests;"
  const cspHeader = `
    default-src 'self';
    script-src 'nonce-${nonce}' 'strict-dynamic' ${
    isDev ? "'unsafe-eval'" : ""
  };
    style-src 'self' https://fonts.googleapis.com ${
      isDev ? "'unsafe-inline'" : ""
    };
    img-src 'self' data:;
    font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com;
    connect-src 'self';
    frame-ancestors 'self';
    form-action 'self';
    base-uri 'self';
    object-src 'none';
  `;
  const sanitizedCspHeader = cspHeader.replace(/\s{2,}/g, " ").trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const isProtectedRoute = !request.nextUrl.pathname.startsWith('/auth');
  if (isProtectedRoute) {
    const tokenCookie = request.cookies.get('trello-session');
    if (!tokenCookie?.value) {
      const loginURL = new URL('/auth/login', request.url);
      const redirectResponse = NextResponse.redirect(loginURL);
      redirectResponse.headers.set('Content-Security-Policy', sanitizedCspHeader);
      return redirectResponse;
    }
  }

  const homeToDashboard = request.nextUrl.pathname === "/";
  if (homeToDashboard) {
    const dashboardURL = new URL("/dashboard", request.url);
    const redirectResponse = NextResponse.redirect(dashboardURL);
    redirectResponse.headers.set("Content-Security-Policy", sanitizedCspHeader);
    return redirectResponse;
  }

  const response = NextResponse.next();

  response.headers.set("Content-Security-Policy", sanitizedCspHeader);

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public|images).*)",
    "/dashboard/:path*",
    "/profile",
  ],
};
