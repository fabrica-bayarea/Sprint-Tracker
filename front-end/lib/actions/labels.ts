'use server';

import api from "@/lib/api/axios";
import { handleAxiosError } from "@/lib/utils/handle-axios-error";
import { validateId } from "@/lib/utils/validateId";

export interface Label {
  id: string;
  boardId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export async function getBoardLabels(boardId: string) {
  try {
    const safeId = validateId(boardId, 'boardId');
    const response = await api.get(`/v1/boards/${safeId}/labels`);
    return { success: true as const, data: response.data as Label[] };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao buscar labels"),
    };
  }
}

export async function createLabel(
  boardId: string,
  data: { name: string; color: string },
) {
  try {
    const safeId = validateId(boardId, 'boardId');
    const response = await api.post(`/v1/boards/${safeId}/labels`, data);
    return { success: true as const, data: response.data as Label };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao criar label"),
    };
  }
}

export async function updateLabel(
  labelId: string,
  data: { name?: string; color?: string },
) {
  try {
    const safeId = validateId(labelId, 'labelId');
    const response = await api.patch(`/v1/labels/${safeId}`, data);
    return { success: true as const, data: response.data as Label };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao atualizar label"),
    };
  }
}

export async function deleteLabel(labelId: string) {
  try {
    const safeId = validateId(labelId, 'labelId');
    const response = await api.delete(`/v1/labels/${safeId}`);
    return { success: true as const, data: response.data };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao remover label"),
    };
  }
}

export async function addLabelToTask(taskId: string, labelId: string) {
  try {
    const safeTaskId = validateId(taskId, 'taskId');
    const safeLabelId = validateId(labelId, 'labelId');
    const response = await api.post(
      `/v1/tasks/${safeTaskId}/labels/${safeLabelId}`,
    );
    return { success: true as const, data: response.data };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao atribuir label"),
    };
  }
}

export async function removeLabelFromTask(taskId: string, labelId: string) {
  try {
    const safeTaskId = validateId(taskId, 'taskId');
    const safeLabelId = validateId(labelId, 'labelId');
    const response = await api.delete(
      `/v1/tasks/${safeTaskId}/labels/${safeLabelId}`,
    );
    return { success: true as const, data: response.data };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao remover label"),
    };
  }
}
