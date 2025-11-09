import React from 'react';

import { useDragListeners } from '@/components/features/dashboard/selectedDashboard/sortableItem';

import { Trash2, Pencil, Grip } from 'lucide-react';

import { useTaskOperations } from '@/lib/hooks/useTaskOperations';
import { useModalStore } from '@/lib/stores/modal';
import { useBoardRole } from '@/lib/contexts/BoardRoleContext';

import type { Task } from '@/lib/types/board';
import { BoardRole } from '@/lib/types/board';

import styles from "./style.module.css";

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const { handleDeleteTask } = useTaskOperations();
  const { openTaskDetailsModal, openEditTaskModal } = useModalStore();
  const dragListeners = useDragListeners();
  const { role, loading } = useBoardRole();
  const canManageTask = !loading && (role === BoardRole.ADMIN || role === BoardRole.MEMBER);

  return (
    <>
      <div className={styles.taskCard}>
        <div className={styles.taskContent}>
          {canManageTask && (
            <button
              {...dragListeners}
              className={styles.dragHandle}
              title="Arrastar tarefa"
            >
              <Grip size={12} />
            </button>
          )}
          <span
            onClick={() => openTaskDetailsModal(task)}
            className={styles.taskTitle}
          >
            {task.title}
          </span>
        </div>
        {canManageTask && (
          <div className={styles.taskActions}>
            <button
              onClick={() => openEditTaskModal(task)}
              className={styles.deleteTaskButton}
              title="Editar tarefa"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => handleDeleteTask(task.id)}
              className={styles.deleteTaskButton}
              title="Deletar tarefa"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
