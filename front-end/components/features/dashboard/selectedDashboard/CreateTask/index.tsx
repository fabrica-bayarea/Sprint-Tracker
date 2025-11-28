"use client";

import React, { useState, useEffect } from 'react';

import { useModalStore } from '@/lib/stores/modal';
import { useBoardStore } from '@/lib/stores/board';
import { useTaskOperations } from '@/lib/hooks/useTaskOperations';

import { Status } from '@/lib/types/board';

import { Input, Textarea } from "@/components/ui";

import styles from './style.module.css';

export default function CreateTaskModal () {
  const { handleCreateTask } = useTaskOperations();
  const { getNextTaskPosition } = useBoardStore();
  const { selectedListId, isCreateTaskModalOpen, closeCreateTaskModal } = useModalStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>(Status.TODO);
  const [dueDate, setDueDate] = useState('');

  const MAX_DESC_LENGTH = 500;

  const nextPosition = selectedListId ? getNextTaskPosition(selectedListId) : 0;

  useEffect(() => {
    if (isCreateTaskModalOpen) {
      setTitle('');
      setDescription('');
      setStatus(Status.TODO);
      setDueDate('');
    }
  }, [isCreateTaskModalOpen]);

  if (!isCreateTaskModalOpen) return null;

  const formatToISO = (dateTimeLocal: string): string | undefined => {
    if (!dateTimeLocal.trim()) return undefined;
    
    try {
      const date = new Date(dateTimeLocal);
      if (isNaN(date.getTime())) return undefined;
      
      return date.toISOString();
    } catch {
      return undefined;
    }
  };

  const handleSubmit = () => {
    if (title.trim()) {
      handleCreateTask({
        title: title.trim(),
        description: description.trim() || undefined,
        position: nextPosition,
        status: status,
        dueDate: formatToISO(dueDate),
      });
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeCreateTaskModal();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <h2>Criar Nova Tarefa</h2>
        
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da tarefa"
          className={styles.modalInput}
          autoFocus
        />
        
        <div className={styles.textareaWrapper}>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            className={styles.modalTextarea}
            rows={3}
            maxLength={MAX_DESC_LENGTH} 
          />
          <div className={styles.charCounter}>
            {description.length} / {MAX_DESC_LENGTH}
          </div>
        </div>
        
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          className={styles.modalSelect}
        >
          <option value="TODO">Pendente</option>
          <option value="IN_PROGRESS">Em progresso</option>
          <option value="DONE">Concluído</option>
        </select>
        
        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          placeholder="Data de vencimento (opcional)"
          className={styles.modalInput}
        />
              
        <div className={styles.modalActions}>
          <button onClick={closeCreateTaskModal} className={styles.cancelButton}>Cancelar</button>
          <button onClick={handleSubmit} className={styles.submitButton}>Criar Tarefa</button>
        </div>
      </div>
    </div>
  );
};