'use server';

import { apiClient } from "@/lib/utils/apiClient";
import { 
  List, 
  ListWithTasksResponse, 
  CreateListData, 
  EditListData 
} from "@/lib/types/board";

export async function getListById(listId: string) {
  return apiClient<ListWithTasksResponse>(`/v1/lists/${listId}`, {
    method: "GET",
    errorMessage: 'Falha ao buscar lista',
  });
}

export async function getAllList(boardId: string) {
  const result = await apiClient<List[]>(`/v1/lists/board/${boardId}`, {
    method: "GET",
    errorMessage: 'Falha ao buscar listas',
  });

  if (!result.success) return result;

  return {
    success: true as const,
    data: result.data.sort((a: List, b: List) => (a.position || 0) - (b.position || 0))
  };
}

export async function createList(newListData: CreateListData) {
  return apiClient<List>('/v1/lists', {
    method: 'POST',
    body: JSON.stringify(newListData),
    errorMessage: 'Falha ao criar lista',
  });
}

export async function editList(listData: EditListData) {
  const updateData: Partial<Omit<EditListData, 'id'>> = {};
  if (listData.title !== undefined) {
    updateData.title = listData.title;
  }
  if (listData.position !== undefined) {
    updateData.position = listData.position;
  }

  return apiClient<List>(`/v1/lists/${listData.id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
    errorMessage: 'Falha ao editar lista',
  });
}

export async function deleteList(listId: string) {
  return apiClient(`/v1/lists/${listId}`, {
    method: 'DELETE',
    errorMessage: 'Falha ao deletar lista',
  });
}

export async function moveList(listId: string, newPosition: number) {
  return apiClient<List>(`/v1/lists/${listId}/position`, {
    method: 'PATCH',
    body: JSON.stringify({ newPosition }),
    errorMessage: 'Falha ao mover lista',
  });
}
