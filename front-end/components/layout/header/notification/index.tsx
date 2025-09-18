"use client";

import React, { useEffect, useState, useRef, type ReactNode } from "react";

import styles from "./style.module.css";

export default function Notification({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
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
    <div className={styles.notification} ref={containerRef}>
      <button onClick={toggleDropdown} className={styles.triggerButton}>
        {children}
      </button>

      {isOpen && (
        <div className={styles.popover}>
          <p>Nenhuma notificação no momento!</p>
        </div>
      )}
    </div>
  );
}
