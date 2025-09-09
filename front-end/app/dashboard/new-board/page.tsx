"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createBoard } from "@/lib/actions/board";
import { useWarningStore } from '@/lib/stores/warning';

import { Input, Textarea, Image } from "@/components/ui";

import styles from "./style.module.css";

export default function NewBoardPage() {
  const router = useRouter();
  const { showWarning } = useWarningStore()
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = await createBoard({ title: name, description });

    if (result.success) {
      setName("");
      setDescription("");
      setImage(null);

      router.push("/dashboard");
      router.refresh();
    } else {
      showWarning(result.error || "Erro desconhecido", 'failed')
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
            <label className={styles.label}>
              Foto
              <div className={styles.squarePhotoPreview}>
                {image ? (
                  <Image src={URL.createObjectURL(image)} alt="Preview" width={100} height={100} className={styles.squarePhotoImg} />
                ) : (
                  <div className={styles.squarePhotoPlaceholder}>Prévia</div>
                )}
              </div>
              <input type="file" className={styles.fileInput} accept="image/*" onChange={handleImageChange} />
            </label>
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Criando..." : "Criar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
