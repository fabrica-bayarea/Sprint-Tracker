'use client';

import React, { useState, useEffect } from 'react';
import { useModalStore } from '@/stores/modal';
import { useListOperations } from '@/hooks/use-list-operations';
import { Input } from '@/components/ui';

import styles from './style.module.css';

export default function RenameListModal() {
  const { isRenameListModalOpen, closeRenameListModal, selectedListId } = useModalStore();

  const { handleRenameList } = useListOperations('');
  const [title, setTitle] = useState('');
  useEffect(() => {
    if (!isRenameListModalOpen) {
      setTitle('');
    }

  }, [isRenameListModalOpen, selectedListId]);

  if (!isRenameListModalOpen || !selectedListId) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      console.error("O título não pode estar vazio.");
      return;
    }
    await handleRenameList({ id: selectedListId, title: title.trim() });
    closeRenameListModal();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Renomear Lista</h2>
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite o novo título da lista"
            className={styles.modalInput}
            autoFocus
          />
          <div className={styles.buttons}>
            <button type="button" onClick={closeRenameListModal} className={styles.buttonSecondary}>
              Cancelar
            </button>
            <button type="submit" className={styles.buttonPrimary}>
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
