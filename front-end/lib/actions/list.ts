'use server';

import api from "@/lib/api/axios";
import { handleAxiosError } from "@/lib/utils/handleAxiosError";
import { List, NewListData, PatchListData } from "../types/list";

export async function getAllList(boardId: string) {
  try {
    const response = await api.get(`/v1/lists/board/${boardId}`);
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
    const response = await api.patch(`/v1/lists/${List.id}`, updateData);
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
    const response = await api.delete(`/v1/lists/${listId}`);
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
    const response = await api.patch(`/v1/lists/${listId}/position`, { newPosition });
    return { success: true, data: response.data || null };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, 'Falha ao mover lista'),
    };
  }
}
