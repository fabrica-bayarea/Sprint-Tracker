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

  const isSprintsPage = pathname === "/dashboard/sprints";

  const handleLogout = async () => {
    await removeCookie("sprinttacker-session");
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
          <NotificationsBell />
          <div className={styles.profileContainer}>
            <Link
              href="/edit-profile/"
              className="w-10 h-10 rounded-full bg-[#FEF2F2] text-[#C01010] flex items-center justify-center font-semibold text-base hover:bg-[#FEE2E2] transition-colors"
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