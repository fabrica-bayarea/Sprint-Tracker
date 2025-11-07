"use client";

import { Bell } from "lucide-react";
import { Image } from "@/components/ui";
import Link from "next/link";
import styles from "./style.module.css";
import Notification from "./notification";
import ProfileMenu from "./menu";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.wrapper_header}>
        <Link href="/dashboard" aria-label="Página inicial do dashboard">
          <Image
            className={styles.logoContainer}
            src="/images/iesb-icon.png"
            alt="Logo IESB"
            width={100}
            height={100}
          />
        </Link>
        <div className={styles.wrapper_header_helps}>
          <Notification>
            <Bell
              size={32}
              color="#949494"
              strokeWidth={2}
              aria-label="Notificações"
            />
          </Notification>

          <ProfileMenu>
            <div
              className={styles.profileImage}
              aria-label="Abrir menu do perfil"
            >
              <div className={styles.profileImageInner}></div>
            </div>
          </ProfileMenu>
        </div>
      </div>
    </header>
  );
}
