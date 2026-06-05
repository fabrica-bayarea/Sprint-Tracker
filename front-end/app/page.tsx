import { redirect } from "next/navigation";

// A raiz (/ em dev, /sprint em prod) não tem página própria — redireciona
// pro dashboard. redirect() do next/navigation respeita o basePath, então
// em prod vai pra /sprint/dashboard. O middleware (proxy.ts) cuida da auth
// dali (manda pro login se não houver sessão).
export default function Home() {
  redirect("/dashboard");
}
