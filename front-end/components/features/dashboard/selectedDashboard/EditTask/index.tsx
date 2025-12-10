"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import { useModalStore } from '@/lib/stores/modal';
import { useTaskOperations } from '@/lib/hooks/useTaskOperations';

import { Input, Textarea } from "@/components/ui";

import { getBoardMembers } from '@/lib/actions/board';
import { Status, type BoardMemberView } from '@/lib/types/board';

import styles from './style.module.css';

export default function EditTaskModal () {
  const { handleEditTask } = useTaskOperations();
  const { selectedTask, isEditTaskModalOpen, closeEditTaskModal } = useModalStore();
  const params = useParams<{ id: string }>();
  const boardId = params?.id ?? '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>(Status.TODO);
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [members, setMembers] = useState<BoardMemberView[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const MAX_DESC_LENGTH = 500;

  useEffect(() => {
    if (!isEditTaskModalOpen || !selectedTask) {
      return;
    }

    setTitle(selectedTask.title || '');
    setDescription(selectedTask.description || '');
    setStatus(selectedTask.status || Status.TODO);
    setDueDate(selectedTask.dueDate ? toLocalDateTime(selectedTask.dueDate) : '');
    setAssigneeId(selectedTask.assignedToId ?? '');

    if (!boardId) {
      setMembers([]);
      return;
    }

    let cancelled = false;

    const fetchMembers = async () => {
      setIsLoadingMembers(true);
      try {
        const response = await getBoardMembers(boardId);
        if (!cancelled) {
          setMembers(response.success ? response.data : []);
        }
      } catch {
        if (!cancelled) {
          setMembers([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMembers(false);
        }
      }
    };

    fetchMembers();

    return () => {
      cancelled = true;
    };
  }, [isEditTaskModalOpen, selectedTask, boardId]);

  if (!isEditTaskModalOpen || !selectedTask) return null;

  function toLocalDateTime(iso: string) {
    const date = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

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
      handleEditTask(
        selectedTask.id,
        {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          dueDate: formatToISO(dueDate),
          position: selectedTask.position,
          assignedToId: assigneeId || null
        }
      );
      closeEditTaskModal();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeEditTaskModal();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <h2>Editar Tarefa</h2>
        <div className={styles.formColumns}>
          <div className={styles.column}>
            <label className={styles.inputLabel}>
              Título da Tarefa <span className={styles.requiredMark}>*</span>
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da tarefa"
              className={styles.modalInput}
              autoFocus
            />

            <label className={styles.inputLabel}>Descrição</label>
            <div className={styles.textareaWrapper}>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição (opcional)"
                className={styles.modalTextarea}
                rows={5}
                maxLength={MAX_DESC_LENGTH}
              />
              <div className={styles.charCounter}>
                {description.length} / {MAX_DESC_LENGTH}
              </div>
            </div>
          </div>

          <div className={styles.column}>
            <label className={styles.inputLabel}>Responsável</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className={styles.modalSelect}
              disabled={isLoadingMembers}
            >
              {isLoadingMembers ? (
                <option value="">Carregando membros...</option>
              ) : (
                <>
                  <option value="">Sem responsável</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </>
              )}
            </select>

            <label className={styles.inputLabel}>
              Status <span className={styles.requiredMark}>*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className={styles.modalSelect}
            >
              <option value="TODO">Pendente</option>
              <option value="IN_PROGRESS">Em progresso</option>
              <option value="DONE">Concluído</option>
            </select>

            <label className={styles.inputLabel}>Data de Vencimento</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="Data de vencimento (opcional)"
              className={styles.modalInput}
            />
          </div>
        </div>
              
        <div className={styles.modalActions}>
          <button onClick={closeEditTaskModal} className={styles.cancelButton}>Cancelar</button>
          <button onClick={handleSubmit} className={styles.submitButton}>Salvar Alterações</button>
        </div>
      </div>
    </div>
  );
};