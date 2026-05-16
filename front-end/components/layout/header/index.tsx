"use client";

import { User, LogOut } from "lucide-react";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from "@tanstack/react-query";
import { removeCookie } from "@/lib/utils/session-cookie";
import { getUserProfile } from "@/lib/actions/profile";
import styles from "./style.module.css";
import { useSprintStore } from "@/stores/use-sprint-store";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "./notifications-bell";
import { ThemeToggle } from "./theme-toggle";

interface UserProfile {
  name?: string | null;
  userName?: string | null;
  email?: string | null;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { view, setView } = useSprintStore();

  const { data: profileData } = useQuery({
    queryKey: ["me-profile"],
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000,
  });
  const profile = (profileData?.success ? profileData.data : null) as UserProfile | null;
  const initial = (
    profile?.name ||
    profile?.userName ||
    profile?.email ||
    "?"
  )[0]?.toUpperCase();

  // Tabs de Sprints (Atual/Histórico/Burndown) ficam ocultas até existir
  // SprintModule no backend. Mantemos a referência ao pathname pra reativar
  // facilmente quando a rota voltar a ser funcional.
  const isSprintsPage = false && pathname === "/dashboard/sprints";

  const handleLogout = async () => {
    await removeCookie("sprinttacker-session");
    // window.location em vez de router.push: hard reload limpa o cache do
    // react-query e desmonta todos os componentes/forms do dashboard. Sem
    // isso, queries em flight com cookie já apagado podem deixar estado
    // sujo e travar o próximo submit de login.
    window.location.href = "/auth/login";
  };

  return (
    <header className={styles.header}>
      <div className={cn("flex py-4 px-6 w-full h-20", 
        isSprintsPage ? "justify-between" : "justify-end"
      )}>
        {isSprintsPage && (
          <div className="flex gap-8">
            {(['Atual', 'Histórico', 'Burndown'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                className={cn(view === tab ? "font-semibold text-red-700 dark:text-red-400 border-b-red-700 dark:border-b-red-400 border-b-2" : "text-muted-foreground", "transition-all duration-200 ease-in-out hover:cursor-pointer hover:text-red-700 dark:hover:text-red-400")}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        <div className={styles.wrapper_header_helps}>
          <ThemeToggle />
          <NotificationsBell />
          <div className={styles.profileContainer}>
            <Link
              href="/edit-profile/"
              className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center font-semibold text-base hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
              aria-label={`Editar perfil de ${profile?.name || profile?.userName || "usuário"}`}
              title={profile?.name || profile?.userName || profile?.email || ""}
            >
              {initial}
            </Link>
            <div className={styles.dropdownMenu}>
              <Link href="/edit-profile/" className={styles.dropdownItem}>
                <User size={16} />
                Editar perfil
              </Link>
              <button onClick={handleLogout} className={styles.dropdownItem}>
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}