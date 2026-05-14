'use server';

import api from "@/lib/api/axios";
import { handleAxiosError } from "@/lib/utils/handle-axios-error";
import { validateId } from "@/lib/utils/validateId";
import { List, NewListData, PatchListData } from "../../types/list";

export async function getAllList(boardId: string) {
  try {
    const safeBoardId = validateId(boardId, 'boardId');
    const response = await api.get(`/v1/lists/board/${safeBoardId}`);
    const data: List[] = response.data;
    return { success: true, data: data.sort((a, b) => (a.position || 0) - (b.position || 0)) };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, 'Falha ao buscar listas'),
    };
  }
}

export async function createList(newListData: NewListData) {
  try {
    const response = await api.post("/v1/lists", newListData);
    return { success: true, data: response.data || null };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, 'Falha ao criar lista'),
    };
  }
}

export async function editList(List: PatchListData) {
  const updateData: Partial<Omit<PatchListData, 'id'>> = {};
  if (List.title !== undefined) {
    updateData.title = List.title;
  }
  if (List.position !== undefined) {
    updateData.position = List.position;
  }

  try {
    const safeId = validateId(List.id, 'id');
    const response = await api.patch(`/v1/lists/${safeId}`, updateData);
    return { success: true, data: response.data || null };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, 'Falha ao editar lista'),
    };
  }
}

export async function deleteList(listId: string) {
  try {
    const safeListId = validateId(listId, 'listId');
    const response = await api.delete(`/v1/lists/${safeListId}`);
    return { success: true, data: response.data || null };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, 'Falha ao deletar lista'),
    };
  }
}

export async function moveList(listId: string, newPosition: number) {
  try {
    const safeListId = validateId(listId, 'listId');
    const response = await api.patch(`/v1/lists/${safeListId}/position`, { newPosition });
    return { success: true, data: response.data || null };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, 'Falha ao mover lista'),
    };
  }
}
