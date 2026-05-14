'use server';

import api from "@/lib/api/axios";
import { handleAxiosError } from "@/lib/utils/handle-axios-error";
import { validateId } from "@/lib/utils/validateId";
import { TaskData, Task, UpdateTaskData } from "../../types/task";

export async function createTask(taskData: TaskData) {
  try {
    const response = await api.post("/v1/tasks", taskData);
    const data: Task = response.data;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Falha ao criar a tarefa"),
    };
  }
}

export async function getTasksByList(listId: string) {
  try {
    const safeListId = validateId(listId, 'listId');
    const response = await api.get(`/v1/tasks/list/${safeListId}`);
    const data: Task[] = response.data;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Falha ao buscar as tarefas da lista"),
    };
  }
}

export async function getTaskById(taskId: string) {
  try {
    const safeTaskId = validateId(taskId, 'taskId');
    const response = await api.get(`/v1/tasks/${safeTaskId}`);
    const data: Task = response.data;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Falha ao buscar a tarefa"),
    };
  }
}

export async function updateTask(taskId: string, updateData: UpdateTaskData) {
  try {
    const safeTaskId = validateId(taskId, 'taskId');
    const response = await api.patch(`/v1/tasks/${safeTaskId}`, updateData);
    const data: Task = response.data;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Falha ao atualizar a tarefa"),
    };
  }
}

export async function deleteTask(taskId: string) {
  try {
    const safeTaskId = validateId(taskId, 'taskId');
    await api.delete(`/v1/tasks/${safeTaskId}`);
    return { success: true, data: { message: 'Tarefa deletada com sucesso' } };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Falha ao deletar a tarefa"),
    };
  }
}

export async function moveTask(taskId: string, newPosition: number) {
  try {
    const safeTaskId = validateId(taskId, 'taskId');
    const response = await api.patch(`/v1/tasks/${safeTaskId}/position`, { newPosition });
    return { success: true, data: response.data || null };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Falha ao mover a tarefa"),
    };
  }
}

export async function moveTaskOtherList(taskId: string, newPosition: number, newListId: string) {
  try {
    const safeTaskId = validateId(taskId, 'taskId');
    const safeNewListId = validateId(newListId, 'newListId');
    const response = await api.patch(`/v1/tasks/${safeTaskId}/move`, {
      newListId: safeNewListId,
      newPosition,
    });
    return { success: true, data: response.data || null };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Falha ao mover a tarefa"),
    };
  }
}

export async function getExpiredTasks() {
  try {
    const response = await api.get("/v1/tasks/due/today");
    return { success: true, data: response.data || [] };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Falha ao buscar tarefas expiradas"),
    };
  }
}
