'use server';

import { apiClient } from "@/lib/utils/apiClient";
import type { CreateTaskData, EditTaskData, Task } from '@/lib/types/board';

export async function createTask(taskData: CreateTaskData) {
  return apiClient<Task>('/v1/tasks', {
    method: "POST",
    body: JSON.stringify(taskData),
    errorMessage: "Falha ao criar a tarefa",
  });
}

export async function getTaskById(taskId: string) {
  return apiClient<Task>(`/v1/tasks/${taskId}`, {
    method: "GET",
    errorMessage: "Falha ao buscar a tarefa",
  });
}

export async function updateTask(taskId: string, updateData: EditTaskData) {
  return apiClient<Task>(`/v1/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(updateData),
    errorMessage: "Falha ao atualizar a tarefa",
  });
}

export async function deleteTask(taskId: string) {
  return apiClient(`/v1/tasks/${taskId}`, {
    method: "DELETE",
    errorMessage: "Falha ao deletar a tarefa",
  });
}

export async function moveTask(taskId: string, newPosition: number) {
  return apiClient<Task>(`/v1/tasks/${taskId}/position`, {
    method: "PATCH",
    body: JSON.stringify({ newPosition }),
    errorMessage: "Falha ao mover a tarefa",
  });
}

export async function moveTaskOtherList(taskId: string, newPosition: number, newListId: string) {
  return apiClient<Task>(`/v1/tasks/${taskId}/move`, {
    method: "PATCH",
    body: JSON.stringify({ newListId, newPosition }),
    errorMessage: "Falha ao mover a tarefa",
  });
}

export async function getExpiredTasks() {
  return apiClient<Task[]>('/v1/tasks/due/today', {
    method: "GET",
    errorMessage: "Falha ao buscar tarefas expiradas",
  });
}
