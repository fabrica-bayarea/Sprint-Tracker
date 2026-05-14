"use client";

import { Bell, User, LogOut } from "lucide-react";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { removeCookie } from "@/lib/utils/session-cookie";
import styles from "./style.module.css";
import { useSprintStore } from "@/stores/use-sprint-store";
import { cn } from "@/lib/utils";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { view, setView } = useSprintStore();

  const isSprintsPage = pathname === "/dashboard/sprints";

  const handleLogout = async () => {
    await removeCookie("trello-session");
    router.push("/auth/login/");
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
                className={cn(view === tab ? "font-semibold text-[#B91C1C] border-b-[#B91C1C] border-b-2" : "text-[#475569]", "transition-all duration-200 ease-in-out hover:cursor-pointer hover:text-[#B91C1C]")}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        <div className={styles.wrapper_header_helps}>
          <Bell size={32} color="#949494" strokeWidth={2} aria-label="Notificações" />
          <div className={styles.profileContainer}>
            <Link href="/edit-profile/" className={styles.profileImage} aria-label="Editar perfil">
              <div className={styles.profileImageInner}></div>
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