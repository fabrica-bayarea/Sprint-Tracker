"use client";

import { Bell, CircleHelp, User, LogOut } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { removeCookie } from "@/lib/utils/session-cookie";
import styles from "./style.module.css";

export default function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    await removeCookie("trello-session");
    router.push("/auth/login/");
  };

  return (
    <header className={styles.header}>
      <div className={styles.wrapper_header}>
        <div className={styles.wrapper_header_helps}>
          <Bell size={32} color="#949494" strokeWidth={2} aria-label="Notificações" />
          <div className={styles.profileContainer}>
            <Link href="/dashboard/edit-profile/" className={styles.profileImage} aria-label="Editar perfil">
              <div className={styles.profileImageInner}></div>
            </Link>
            <div className={styles.dropdownMenu}>
              <Link href="/dashboard/edit-profile/" className={styles.dropdownItem}>
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