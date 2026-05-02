"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createBoard } from "@/lib/actions/board";
import { useWarningStore } from "@/lib/stores/warning";
import Link from "next/link";

import { Input, Textarea } from "@/components/ui";

import styles from "./style.module.css";

export default function NewBoardPage() {
  const router = useRouter();
  const { showWarning } = useWarningStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  
  const MAX_DESC_LENGTH = 500;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = await createBoard({ title: name, description });

    if (result.success) {
      setName("");
      setDescription("");

      router.push("/dashboard");
      router.refresh();
    } else {
      showWarning(result.error || "Erro desconhecido", "failed");
    }

    setLoading(false);
  }

  return (
    <div className={styles.container}>
      <Link href="/dashboard" className={styles.backToDashboard}>
        <span>
          <svg
            width="38"
            height="38"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Voltar
        </span>
      </Link>
      <h2 className={styles.title}>Criar um espaço de trabalho</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="Nome"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div>
          <Textarea
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
            maxLength={MAX_DESC_LENGTH}
          />
          <div className={styles.charCounter}>
            {description.length} / {MAX_DESC_LENGTH}
          </div>
        </div>
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Criando..." : "Criar"}
        </button>
      </form>
    </div>
  );
}