import { useCallback } from 'react';
import { createTask, updateTask, deleteTask, moveTask, moveTaskOtherList } from '@/lib/actions/task';
import { useBoardStore } from '@/lib/stores/board';
import { useModalStore } from '@/lib/stores/modal';
import { useNotificationStore } from '@/lib/stores/notification';
import type { CreateTaskData, Status } from '@/lib/types/board';

export function useTaskOperations() {
  const { addTask, editTask, removeTask, getNextTaskPosition } = useBoardStore();
  const { selectedListId, closeCreateTaskModal } = useModalStore();
  const { showNotification } = useNotificationStore();

  const handleCreateTask = useCallback(async (taskData: CreateTaskData) => {
    if (!taskData.title || taskData.title.trim() === "") {
      showNotification("O título da tarefa não pode estar vazio.", "failed");
      return;
    }

    const newTaskData = {
      listId: selectedListId,
      ...taskData
    };

    const result = await createTask(newTaskData);
    if (result.success && result.data) {
      const task = {
        id: result.data.id,
        title: result.data.title,
        description: result.data.description,
        position: result.data.position,
        status: result.data.status as Status,
        dueDate: result.data.dueDate
      };
      
      addTask(selectedListId, task);
      closeCreateTaskModal();
      showNotification("Tarefa criada com sucesso!", "success");
    } else {
      showNotification("Erro ao criar tarefa: " + result.error, "failed");
    }
  }, [selectedListId, addTask, closeCreateTaskModal, showNotification]);

  const handleEditTask = useCallback(async (taskId: string, updatedData: Partial<CreateTaskData>) => {
    try {
      const result = await updateTask(taskId, updatedData);
      if (result.success && result.data) {
        editTask(taskId, {
          id: result.data.id,
          title: result.data.title,
          description: result.data.description,
          position: result.data.position,
          status: result.data.status as Status,
          dueDate: result.data.dueDate
        });
        showNotification("Tarefa editada com sucesso!", "success");
      } else {
        showNotification("Erro ao editar tarefa: " + result.error, "failed");
      }
    } catch (error) {
      showNotification("Erro inesperado ao editar tarefa: " + error, "failed");
    }
  }, [editTask, showNotification]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    const result = await deleteTask(taskId);
    if (result.success) {
      removeTask(taskId);
      showNotification("Tarefa deletada com sucesso!", "success");
    } else {
      showNotification(result.error || 'Erro ao deletar tarefa', "failed");
    }
  }, [removeTask, showNotification]);

  const handleMoveTask = useCallback(async (taskId: string, newPosition: number) => {
    try {
      const result = await moveTask(taskId, newPosition);
      if (result.success) {
        showNotification("Tarefa movida com sucesso!", "success");
        return true;
      } else {
        showNotification("Erro ao mover tarefa: " + result.error, "failed");
        return false;
      }
    } catch (error) {
      showNotification("Erro inesperado ao mover tarefa: " + error, "failed");
      return false;
    }
  }, [showNotification]);

  const handleMoveTaskToOtherList = useCallback(async (taskId: string, newPosition: number, newListId: string) => {
    try {
      const result = await moveTaskOtherList(taskId, newPosition, newListId);
      if (result.success) {
        showNotification("Tarefa movida com sucesso!", "success");
        return true;
      } else {
        showNotification("Erro ao mover tarefa: " + result.error, "failed");
        return false;
      }
    } catch (error) {
      showNotification("Erro inesperado ao mover tarefa: " + error, "failed");
      return false;
    }
  }, [showNotification]);

  return {
    handleCreateTask,
    handleEditTask,
    handleDeleteTask,
    handleMoveTask,
    handleMoveTaskToOtherList,
    getNextTaskPosition,
  };
}
