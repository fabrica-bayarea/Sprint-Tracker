"use client";

import React, { useEffect, useState, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, CircleHelp, LogOut } from "lucide-react";
import { removeCookie } from "@/lib/utils/sessionCookie";
import styles from "./style.module.css";

export default function ProfileMenu({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    await removeCookie("sprinttacker-session");
    router.push("/auth/login/");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.profileContainer} ref={containerRef}>
      <button onClick={toggleDropdown} className={styles.triggerButton}>
        {children}
      </button>

      {isOpen && (
        <div className={styles.popover}>
          <Link href="/dashboard/edit-profile/" className={styles.dropdownItem}>
            <User size={16} />
            Editar perfil
          </Link>
          <Link href="/ajuda" className={styles.dropdownItem}>
            <CircleHelp size={16} />
            Ajuda
          </Link>
          <button onClick={handleLogout} className={styles.dropdownItem}>
            <LogOut size={16} />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
