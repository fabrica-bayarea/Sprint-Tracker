import React from 'react';

import { useDragListeners } from '@/components/features/dashboard/selectedDashboard/sortableItem';

import { Trash2, Pencil, Grip, ListMinus, Download } from 'lucide-react';

import { useTaskOperations } from '@/lib/hooks/useTaskOperations';
import { useModalStore } from '@/lib/stores/modal';
import { useBoardStore } from '@/lib/stores/board';
import { useBoardRole } from '@/lib/contexts/BoardRoleContext';
import { useWarningStore } from '@/lib/stores/warning';
import { exportTaskLogsCsv } from '@/lib/actions/task';

import type { Task } from '@/lib/types/board';
import { BoardRole } from '@/lib/types/board';

import styles from "./style.module.css";

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const { handleDeleteTask } = useTaskOperations();
  const { openTaskDetailsModal, openEditTaskModal } = useModalStore();
  const { isCurrentUserAdmin } = useBoardStore();
  const { showWarning } = useWarningStore();
  const dragListeners = useDragListeners();
  const { role, loading } = useBoardRole();
  const canManageTask = !loading && (role === BoardRole.ADMIN || role === BoardRole.MEMBER);

  const handleDownloadLogs = async () => {
    try {
      const result = await exportTaskLogsCsv(task.id);
      if (!result.success || !result.csvUrl) {
        showWarning(result.error || "Erro ao exportar logs", 'failed');
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
      showWarning("Erro ao exportar logs", 'failed');
    }
  };

  const DragAndDropButton = () => {
    return (
      <button
        {...dragListeners}
        className={styles.dragHandle}
        title="Arrastar tarefa"
      >
        <Grip size={12} />
      </button>
    )
  }

  const Actions = () => {
    return (
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
    )
  }

  const DateTask = ({ taskDate }: { taskDate: string }) => {
    const dateObject: Date = new Date(taskDate);
    return <div>{dateObject.toLocaleDateString('pt-BR')}</div>;
  }

  return (
    <div className={styles.taskCard}>

      <div className={styles.taskTopWrapper}>
        <div className={styles.taskContent}>
          {canManageTask && <DragAndDropButton />}
          <span
            onClick={() => openTaskDetailsModal(task)}
            className={styles.taskTitle}
          >
            {task.title}
          </span>
        </div>
        {task.description && (
          <div className={styles.descriptionButton}>
            <ListMinus size={14}/>
          </div>
        )}
      </div>

      <div className={styles.taskBottomWrapper}>
        <div>
          {task.dueDate && <DateTask taskDate={task.dueDate} />}
        </div>
        <div>
          {canManageTask && <Actions />}
        </div>
      </div>

    </div>
  );
}
