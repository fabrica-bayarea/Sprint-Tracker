'use server';

import { apiClient } from "@/lib/utils/apiClient";
import { getCookie } from "@/lib/utils/sessionCookie";
import { env } from "@/lib/config/env";
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

export async function getTaskLogs(taskId: string) {
  return apiClient(`/v1/task-logs/${taskId}`, {
    method: "GET",
    errorMessage: "Falha ao buscar logs da tarefa",
  });
}

export async function exportTaskLogsCsv(
  taskId: string,
): Promise<{ success: boolean; csvUrl?: string; error?: string }> {
  try {
    const cookie = await getCookie("sprinttacker-session");
    const response = await fetch(
      `${env.apiUrl}/v1/task-logs/${taskId}/export/csv`,
      {
        method: "GET",
        headers: cookie ? { Cookie: cookie } : {},
      },
    );

    if (!response.ok) {
      return { success: false, error: "Falha ao exportar logs" };
    }

    const csvText = await response.text();
    return { success: true, csvUrl: csvText };
  } catch {
    return { success: false, error: "Falha ao exportar logs" };
  }
}

export async function getExpiredTasks() {
  return apiClient<Task[]>('/v1/tasks/due/today', {
    method: "GET",
    errorMessage: "Falha ao buscar tarefas expiradas",
  });
}
