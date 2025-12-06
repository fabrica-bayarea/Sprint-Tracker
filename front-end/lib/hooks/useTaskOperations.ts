import { useCallback } from 'react';
import { createTask, updateTask, deleteTask, moveTask, moveTaskOtherList } from '@/lib/actions/task';
import { useBoardStore } from '@/lib/stores/board';
import { useModalStore } from '@/lib/stores/modal';
import { useWarningStore } from '@/lib/stores/warning';
import type { CreateTaskData, Status } from '@/lib/types/board';

interface TaskData {
  title: string;
  description?: string;
  position: number;
  status: Status;
  dueDate?: string;
}

/**
 * Hook para gerenciar operações CRUD de tarefas
 * Fornece funções para criar, editar, deletar e mover tarefas entre listas
 * com validações e feedback visual ao usuário
 */
export function useTaskOperations() {
  const { addTask, editTask, removeTask, getNextTaskPosition } = useBoardStore();
  const { selectedListId, closeCreateTaskModal } = useModalStore();
  const { showWarning } = useWarningStore();

  const handleCreateTask = useCallback(async (taskData: TaskData) => {
    if (!taskData.title?.trim()) {
      showWarning("O título da tarefa não pode estar vazio.", "failed");
      return;
    }

    const result = await createTask({ listId: selectedListId, ...taskData });
    if (result.success) {
      addTask(selectedListId, result.data);
      closeCreateTaskModal();
      showWarning("Tarefa criada com sucesso!", "success");
    } else {
      showWarning(result.error, "failed");
    }
  }, [selectedListId, addTask, closeCreateTaskModal, showWarning]);

  const handleEditTask = useCallback(async (taskId: string, updatedData: Partial<CreateTaskData>) => {
    const result = await updateTask(taskId, updatedData);
    if (result.success) {
      editTask(taskId, {
        id: result.data.id,
        title: result.data.title,
        description: result.data.description,
        position: result.data.position,
        status: result.data.status as Status,
        dueDate: result.data.dueDate
      });
      showWarning("Tarefa editada com sucesso!", "success");
    } else {
      showWarning(result.error, "failed");
    }
  }, [editTask, showWarning]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    const result = await deleteTask(taskId);
    if (result.success) {
      removeTask(taskId);
      showWarning("Tarefa deletada com sucesso!", "success");
    } else {
      showWarning(result.error, "failed");
    }
  }, [removeTask, showWarning]);

  const handleMoveTask = useCallback(async (taskId: string, newPosition: number) => {
    const result = await moveTask(taskId, newPosition);
    showWarning(result.success ? "Tarefa movida com sucesso!" : result.error, result.success ? "success" : "failed");
    return result.success;
  }, [showWarning]);

  const handleMoveTaskToOtherList = useCallback(async (taskId: string, newPosition: number, newListId: string) => {
    const result = await moveTaskOtherList(taskId, newPosition, newListId);
    showWarning(result.success ? "Tarefa movida com sucesso!" : result.error, result.success ? "success" : "failed");
    return result.success;
  }, [showWarning]);

  return {
    handleCreateTask,
    handleEditTask,
    handleDeleteTask,
    handleMoveTask,
    handleMoveTaskToOtherList,
    getNextTaskPosition,
  };
}
