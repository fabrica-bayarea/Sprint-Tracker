"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { X, Calendar, User } from 'lucide-react';

import { useModalStore } from '@/lib/stores/modal';
import { getBoardMembers } from '@/lib/actions/board';

import styles from './style.module.css';

export default function TaskDetailsModal() {
  const {
    isTaskDetailsModalOpen,
    selectedTask,
    closeTaskDetailsModal,
  } = useModalStore();
  const params = useParams<{ id: string }>();
  const boardId = params?.id ?? '';

  const [assigneeName, setAssigneeName] = useState('');
  const [isLoadingAssignee, setIsLoadingAssignee] = useState(false);

  const hasTask = Boolean(selectedTask);
  const assignedToId = selectedTask?.assignedToId;
  const taskId = selectedTask?.id;

  useEffect(() => {
    if (!isTaskDetailsModalOpen || !hasTask) {
      return;
    }

    if (!assignedToId) {
      setAssigneeName('');
      setIsLoadingAssignee(false);
      return;
    }

    if (!boardId) {
      setAssigneeName('Responsável indisponível');
      setIsLoadingAssignee(false);
      return;
    }

    let cancelled = false;
    const fetchAssignee = async () => {
      setIsLoadingAssignee(true);
      setAssigneeName('');
      try {
        const response = await getBoardMembers(boardId);
        if (cancelled) return;

        if (response.success) {
          const member = response.data.find((item) => String(item.id) === String(assignedToId));
          setAssigneeName(member?.name || 'Usuário não encontrado');
        } else {
          setAssigneeName('Não foi possível carregar');
        }
      } catch {
        if (!cancelled) {
          setAssigneeName('Não foi possível carregar');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAssignee(false);
        }
      }
    };

    fetchAssignee();

    return () => {
      cancelled = true;
    };
  }, [isTaskDetailsModalOpen, hasTask, boardId, assignedToId, taskId]);

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

  const hasAssignee = Boolean(selectedTask.assignedToId);
  const assigneeDisplay = isLoadingAssignee
    ? 'Carregando...'
    : hasAssignee
      ? assigneeName || 'Usuário não encontrado'
      : 'Sem responsável';
  const isPlaceholder = !hasAssignee || isLoadingAssignee || assigneeDisplay === 'Usuário não encontrado' || assigneeDisplay === 'Não foi possível carregar' || assigneeDisplay === 'Responsável indisponível';

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
            <label className={styles.label}>Responsável:</label>
            <div className={styles.assigneeContainer}>
              <User size={16} />
              <span className={isPlaceholder ? styles.placeholder : styles.textValue}>{assigneeDisplay}</span>
            </div>
          </div>

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
