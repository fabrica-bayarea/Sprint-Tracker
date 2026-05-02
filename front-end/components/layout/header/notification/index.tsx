"use client";

import React, { useEffect, useState, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import styles from "./style.module.css";
import { getUserNotifications, type UserNotification } from "@/lib/actions/me";
import { respondInvite } from "@/lib/actions/board";
import { getSocket } from "@/lib/socket";
import { BoardRole } from "@/lib/types/board";

export default function Notification({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [selected, setSelected] = useState<UserNotification | null>(null);
  const [responding, setResponding] = useState<"accept" | "reject" | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [hasNew, setHasNew] = useState(false);

  const toggleDropdown = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) setHasNew(false);
      return next;
    });
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

  useEffect(() => {
    const socket = getSocket();
    const onNew = () => {
      setHasNew(true);
    };
    socket.on("newNotification", onNew);

    return () => {
      socket.off("newNotification", onNew);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    setLoading(true);
    setError(null);

    getUserNotifications()
      .then((res) => {
        if (ignore) return;
        if (res.success) {
          setNotifications(res.data);
        } else {
          setError(res.error || "Falha ao carregar notificações");
        }
      })
      .catch(() => {
        if (ignore) return;
        setError("Falha ao carregar notificações");
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  return (
    <div className={styles.notification} ref={containerRef}>
      <button onClick={toggleDropdown} className={styles.triggerButton}>
        {children}
        {hasNew && <span className={styles.badge} aria-label="Novas notificações" />}
      </button>

      {isOpen && (
        <div className={styles.popover}>
          {loading && <p>Carregando notificações...</p>}
          {!loading && error && (
            <p style={{ color: "#d00" }}>{error}</p>
          )}
          {!loading && !error && notifications.length === 0 && (
            <p>Nenhuma notificação!</p>
          )}
          {!loading && !error && notifications.length > 0 && (
            <ul className={styles.list}>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={styles.item}
                  onClick={() => setSelected(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelected(n);
                  }}
                >
                  <div className={styles.title}>
                    {"Você recebeu com convite para o quadro "}
                    <strong>{n.board?.title}</strong>
                    {"!"}
                  </div>
                  <small className={styles.time}>
                    {new Date(n.createdAt).toLocaleString()}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Modal de detalhes da notificação */}
      {selected && (
        <>
          <div className={styles.backdrop} onClick={() => setSelected(null)} />
          <div className={styles.modal} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <span>Um novo convite chegou!</span>
              <button
                type="button"
                className={styles.closeButton}
                aria-label="Fechar modal"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ marginTop: 0 }}>
                <strong className={styles.senderName}>{
                  (selected.sender?.name || selected.sender?.userName || 'Usuário')
                    .toString()
                    .replace(/^(\p{L})/u, (m) => m.toUpperCase())
                }</strong>
                {" convidou você para ser "}
                <strong>{
                  selected.role === BoardRole.ADMIN ? 'administrador' :
                  selected.role === BoardRole.OBSERVER ? 'observador' :
                  'membro'
                }</strong>
                {" no quadro "}
                <strong>{selected.board.title}</strong>
                {"! Você deseja aceitar?"}
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={async () => {
                  if (!selected) return;
                  setResponding('reject');
                  const res = await respondInvite(selected.board.id, selected.id, false);
                  if (res.success) {
                    setNotifications((prev) => prev.filter((x) => x.id !== selected.id));
                    setTimeout(() => setSelected(null), 500);
                  }
                  setResponding(null);
                }}
                disabled={responding !== null}
              >
                Recusar
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={async () => {
                  if (!selected) return;
                  setResponding('accept');
                  const res = await respondInvite(selected.board.id, selected.id, true);
                  if (res.success) {
                    setNotifications((prev) => prev.filter((x) => x.id !== selected.id));
                    // Fecha o modal e força o recarregamento da página para refletir mudanças
                    setSelected(null);
                    try { router.refresh(); } catch {}
                    if (typeof window !== 'undefined') {
                      window.location.reload();
                    }
                  }
                  setResponding(null);
                }}
                disabled={responding !== null}
              >
                Aceitar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
