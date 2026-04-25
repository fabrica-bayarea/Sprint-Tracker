"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createBoard } from "@/lib/actions/board";
import { useNotificationStore } from '@/lib/stores/notification';

import { Input, Textarea } from "@/components/ui";

import styles from "./style.module.css";

export default function NewBoardPage() {
  const router = useRouter();
  const { showNotification } = useNotificationStore()
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = await createBoard({ title: name, description });

    if (result.success) {
      setName("");
      setDescription("");

      router.push("/dashboard");
      router.refresh();
    } else {
      showNotification(result.error || "Erro desconhecido", 'failed')
    }

    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <p>
        Dashboard &gt; new-board
      </p>
      <h2 className={styles.title}>Criar um espaço de trabalho</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.rowGroups}>
          <div className={styles.leftGroup}>
            <Input 
              label="Nome" 
              type="text"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
            <Textarea
              label="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>
          <div className={styles.rightGroup}>
            {/* Photo upload hidden — no storage solution configured */}
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Criando..." : "Criar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
