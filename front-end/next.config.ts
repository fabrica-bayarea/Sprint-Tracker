import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  // Em produção o app é servido sob https://bayarea.dataiesb.com/sprint.
  // basePath faz o Next prefixar todas as URLs internas (links, redirects,
  // assets /_next) com /sprint. Em dev fica vazio pra rodar em localhost:3001/.
  // Requer que o ingress passe /sprint/* pro front SEM remover o prefixo.
  basePath: isDev ? undefined : '/sprint',
  // Otimizador de imagem do Next (/_next/image) retorna 400 sob basePath
  // no deploy standalone — ele tenta buscar a imagem em /images (sem o
  // /sprint) e falha. unoptimized faz o <Image> servir o arquivo cru em
  // /sprint/images/... (que existe), corrigindo os logos quebrados.
  // São assets estáticos pequenos, otimização não faz diferença aqui.
  images: { unoptimized: true },
  async headers() {
    // TODO: Ao implementar TLS, colocar "upgrade-insecure-requests;"
    const cspHeader = `
      default-src 'self';
      script-src 'self' ${isDev ? "'unsafe-eval'" : ""};
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data:;
      font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com;
      connect-src 'self' ws: wss:;
      frame-ancestors 'self';
      form-action 'self';
      base-uri 'self';
      object-src 'none';
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/(.*)',
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