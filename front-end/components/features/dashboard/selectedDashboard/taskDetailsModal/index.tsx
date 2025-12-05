"use client";

import React from 'react';
import { X, Calendar } from 'lucide-react';

import { useModalStore } from '@/lib/stores/modal';

import styles from './style.module.css';

export default function TaskDetailsModal() {
  const {
    isTaskDetailsModalOpen,
    selectedTask,
    closeTaskDetailsModal,
  } = useModalStore();

  if (!isTaskDetailsModalOpen || !selectedTask) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não definida';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const statusMap = {
    TODO: {
      color: styles.statusPending,
      label: 'Pendente',
    },
    IN_PROGRESS: {
      color: styles.statusInProgress,
      label: 'Em Progresso',
    },
    DONE: {
      color: styles.statusCompleted,
      label: 'Concluído',
    },
    DEFAULT: {
      color: styles.statusDefault,
      label: '',
    },
  };

  const getStatusColor = (status: string) => {
    const key = status?.toUpperCase() as keyof typeof statusMap;
    return statusMap[key]?.color || statusMap.DEFAULT.color;
  };

  const getStatusLabel = (status: string) => {
    const key = status?.toUpperCase() as keyof typeof statusMap;
    return statusMap[key]?.label || status;
  };

  return (
    <div className={styles.overlay} onClick={closeTaskDetailsModal}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{selectedTask.title}</h2>
          <button className={styles.closeButton} onClick={closeTaskDetailsModal}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.field}>
            <label className={styles.label}>Descrição:</label>
            <p className={styles.description}>
              {selectedTask.description || 'Sem descrição'}
            </p>
          </div>
          
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>Status:</label>
              <span className={`${styles.status} ${getStatusColor(selectedTask.status)}`}>
                {getStatusLabel(selectedTask.status)}
              </span>
            </div>
            
            <div className={styles.field}>
              <label className={styles.label}>Data de Vencimento:</label>
              <div className={styles.dateContainer}>
                <Calendar size={16} />
                <span>{formatDate(selectedTask.dueDate || '')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
