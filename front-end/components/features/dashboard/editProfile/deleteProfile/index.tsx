"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"

import { deleteUserProfile } from "@/lib/actions/profile";
import { useWarningStore } from '@/lib/stores/warning';

import styles from "./style.module.css";

export default function DeleteAccountButton() {
  const router = useRouter()
  const { showWarning } = useWarningStore()
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.")) return;
    setDeleteLoading(true);

    const result = await deleteUserProfile();

    if (result.success) {
      router.push("/auth/login");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      router.refresh();
    } else {
      showWarning(result.error || "Erro desconhecido", 'failed')
    }

    setDeleteLoading(false);
  }

  return (
    <div className={styles.wrapperDelete}>
      <div className={styles.deleteInfo}>
        <h2>Deletar conta</h2>
        <p>Delete sua conta e informação do sistema</p>
      </div>
      <button
        type="button"
        className={styles.deleteButton}
        onClick={handleDelete}
        disabled={deleteLoading}
      >
        {deleteLoading ? "Deletando..." : "Deletar"}
      </button>
    </div>
  );
}
