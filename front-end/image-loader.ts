// Custom loader pro next/image respeitar o basePath em produção.
//
// Problema: <Image src="/images/x.png"> com string não prefixa o basePath
// sozinho. O otimizador (/_next/image) dá 400 sob basePath no standalone,
// e com unoptimized o src vira /images/... (sem /sprint) → 404.
//
// Este loader prefixa o /sprint em produção (igual ao basePath do
// next.config) e devolve a imagem crua. URLs absolutas (ex: avatares
// externos) passam sem alteração.
const basePath = process.env.NODE_ENV === "production" ? "/sprint" : "";

export default function imageLoader({ src }: { src: string }): string {
  if (/^https?:\/\//.test(src)) return src;
  return `${basePath}${src}`;
}
