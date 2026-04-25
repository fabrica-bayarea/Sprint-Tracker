import React from 'react';

import { useDragListeners } from '@/components/features/dashboard/selectedDashboard/sortableItem';

import { Trash2, Pencil, Grip, Download } from 'lucide-react';

import { useTaskOperations } from '@/lib/hooks/useTaskOperations';
import { useModalStore } from '@/lib/stores/modal';
import { useBoardStore } from '@/lib/stores/board';
import { useNotificationStore } from '@/lib/stores/notification';
import { exportTaskLogsCsv } from '@/lib/actions/task';

import type { Task } from '@/lib/types/board';

import styles from './style.module.css';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const { handleDeleteTask } = useTaskOperations();
  const { openTaskDetailsModal, openEditTaskModal } = useModalStore();
  const { isCurrentUserAdmin } = useBoardStore();
  const { showNotification } = useNotificationStore();
  const dragListeners = useDragListeners();

  const handleDownloadLogs = async () => {
    try {
      const result = await exportTaskLogsCsv(task.id);
      if (!result.success || !result.csvUrl) {
        showNotification(result.error || "Erro ao exportar logs", 'failed');
        return;
      }
      const blob = new Blob([result.csvUrl], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `task-${task.id}-logs.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showNotification("Erro ao exportar logs", 'failed');
    }
  };

  return (
    <div className={styles.taskCard}>
      <div className={styles.taskContent}>
        <button
          {...dragListeners}
          className={styles.dragHandle}
          title="Arrastar tarefa"
        >
          <Grip size={12} />
        </button>
        <span
          onClick={() => openTaskDetailsModal(task)}
          className={styles.taskTitle}
        >
          {task.title}
        </span>
      </div>
      <div className={styles.taskActions}>
        {isCurrentUserAdmin && (
          <button
            onClick={handleDownloadLogs}
            className={styles.deleteTaskButton}
            title="Baixar logs do card (CSV)"
          >
            <Download size={14} />
          </button>
        )}
        <button
          onClick={() => openEditTaskModal(task)}
          className={styles.deleteTaskButton}
          title="Editar tarefa"
        >
          <Pencil size={14}/>
        </button>
        <button
          onClick={() => handleDeleteTask(task.id)}
          className={styles.deleteTaskButton}
          title="Deletar tarefa"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
