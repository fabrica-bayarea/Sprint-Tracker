'use server';

import api from "@/lib/api/axios";
import { handleAxiosError } from "@/lib/utils/handle-axios-error";
import { validateId } from "@/lib/utils/validateId";

export type LogAction =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_MOVED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_ARCHIVED'
  | 'TASK_DELETED';

export interface TaskLog {
  id: string;
  action: LogAction;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export async function getTaskLogs(taskId: string) {
  try {
    const safeTaskId = validateId(taskId, 'taskId');
    const response = await api.get(`/v1/task-logs/${safeTaskId}`);
    return { success: true as const, data: response.data as TaskLog[] };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao buscar histórico da tarefa"),
    };
  }
}
