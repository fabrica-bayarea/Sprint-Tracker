"use client";

import { Bell, CircleHelp, User, LogOut } from "lucide-react";
import { Image } from "@/components/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { removeCookie } from "@/lib/utils/sessionCookie";
import styles from "./style.module.css";
import Notification from "./notification";

export default function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    await removeCookie("trello-session");
    router.push("/auth/login/");
  };

  return (
    <header className={styles.header}>
      <div className={styles.wrapper_header}>
        <Image
          className={styles.logoContainer}
          src="/images/iesb-icon.png"
          alt="Logo IESB"
          width={100}
          height={100}
        />
        <div className={styles.wrapper_header_helps}>
          <Notification>
            <Bell
              size={32}
              color="#949494"
              strokeWidth={2}
              aria-label="Notificações"
            />
          </Notification>
          <CircleHelp
            size={32}
            color="#949494"
            strokeWidth={2}
            aria-label="Ajuda"
          />
          <div className={styles.profileContainer}>
            <Link
              href="/dashboard/edit-profile/"
              className={styles.profileImage}
              aria-label="Editar perfil"
            >
              <div className={styles.profileImageInner}></div>
            </Link>
            <div className={styles.dropdownMenu}>
              <Link
                href="/dashboard/edit-profile/"
                className={styles.dropdownItem}
              >
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
  );
}
