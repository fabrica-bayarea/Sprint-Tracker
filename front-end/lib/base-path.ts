/**
 * basePath do app. Vazio em dev (localhost:3001/), "/sprint" em produção
 * (servido em bayarea.dataiesb.com/sprint — ver basePath no next.config).
 *
 * O Next prefixa o basePath sozinho em <Link>, router.push e redirect() do
 * next/navigation. Mas APIs do browser (window.location) NÃO conhecem o
 * basePath — então redirects via window.location precisam usar withBasePath().
 */
export const BASE_PATH =
  process.env.NODE_ENV === "production" ? "/sprint" : "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
