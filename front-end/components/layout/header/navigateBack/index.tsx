"use client";

import React, { type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import styles from "./style.module.css";

export default function NavigateBack({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleGoBack = () => {
    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length <= 1) {
      return;
    }
    const parentPath = "/" + pathSegments.slice(0, -1).join("/");
    router.push(parentPath);
  };

  const canGoBack = pathname.split("/").filter(Boolean).length > 1;

  if (!canGoBack) {
    return null;
  }

  return (
    <button
      onClick={handleGoBack}
      className={styles.backButton}
      aria-label="Voltar para a página anterior"
    >
      {children}
    </button>
  );
}
