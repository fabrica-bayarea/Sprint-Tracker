'use server';

import api from "@/lib/api/axios";
import { handleAxiosError } from "@/lib/utils/handle-axios-error";
import { validateId } from "@/lib/utils/validateId";

export interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    userName: string | null;
    email: string | null;
  };
}

export async function getTaskComments(taskId: string) {
  try {
    const safeId = validateId(taskId, 'taskId');
    const response = await api.get(`/v1/tasks/${safeId}/comments`);
    return { success: true as const, data: response.data as TaskComment[] };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao buscar comentários"),
    };
  }
}

export async function createComment(taskId: string, content: string) {
  try {
    const safeId = validateId(taskId, 'taskId');
    const response = await api.post(`/v1/tasks/${safeId}/comments`, { content });
    return { success: true as const, data: response.data as TaskComment };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao criar comentário"),
    };
  }
}

export async function updateComment(commentId: string, content: string) {
  try {
    const safeId = validateId(commentId, 'commentId');
    const response = await api.patch(`/v1/comments/${safeId}`, { content });
    return { success: true as const, data: response.data as TaskComment };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao atualizar comentário"),
    };
  }
}

export async function deleteComment(commentId: string) {
  try {
    const safeId = validateId(commentId, 'commentId');
    const response = await api.delete(`/v1/comments/${safeId}`);
    return { success: true as const, data: response.data };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao excluir comentário"),
    };
  }
}
