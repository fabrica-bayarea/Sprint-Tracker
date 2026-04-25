import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async headers() {
    // TODO: Ao implementar TLS, colocar "upgrade-insecure-requests;"
    const cspHeader = `
      default-src 'self';
      script-src 'self';
      style-src 'self' https://fonts.googleapis.com 'unsafe-inline';
      img-src 'self' data:;
      font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com;
      connect-src 'self';
      frame-ancestors 'self';
      form-action 'self';
      base-uri 'self';
      object-src 'none';
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      },
    ];
  },
};

export default nextConfig;