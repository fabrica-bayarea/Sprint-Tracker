'use server';

import { apiClient } from "@/lib/utils/apiClient";
import {
  type CreateBoardData,
  type BoardListItemResponse,
  type BoardResponse,
  type BoardMemberResponse,
  BoardRole,
  BoardVisibility,
  boardListItemResponseToView,
  boardResponseToBoard,
  boardMemberResponseToView,
} from "@/lib/types/board";

export async function createBoard(boardData: CreateBoardData) {
  return apiClient<{ message: string }>('/v1/boards', {
    method: "POST",
    body: JSON.stringify({
      ...boardData,
      visibility: BoardVisibility.PRIVATE,
    }),
    errorMessage: "Falha ao criar o board",
  });
}

export async function getBoards() {
  const result = await apiClient<BoardListItemResponse[]>('/v1/boards', {
    method: "GET",
    errorMessage: "Falha ao buscar os boards",
  });

  if (!result.success) return result;

  return {
    success: true as const,
    data: result.data.map(boardListItemResponseToView),
  };
}

export async function getBoardById(boardId: string) {
  const result = await apiClient<BoardResponse>(`/v1/boards/${boardId}`, {
    method: "GET",
    errorMessage: "Falha ao buscar o board",
  });

  if (!result.success) return result;

  const board = boardResponseToBoard(result.data);

  return {
    success: true as const,
    data: {
      id: board.id,
      name: board.title,
      description: board.description,
      visibility: board.visibility,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      ownerId: board.ownerId,
      lists: board.lists,
    },
  };
}

export async function getBoardMembers(boardId: string) {
  const result = await apiClient<BoardMemberResponse[]>(`/v1/boards/${boardId}/members`, {
    method: "GET",
    errorMessage: "Falha ao buscar membros do board",
  });

  if (!result.success) return result;

  return {
    success: true as const,
    data: result.data.map(boardMemberResponseToView),
  };
}

export async function deleteBoard(boardId: string) {
  return apiClient(`/v1/boards/${boardId}`, {
    method: "DELETE",
    errorMessage: "Falha ao deletar o board",
  });
}

export async function deleteBoardMember(boardId: string, userId: string) {
  return apiClient(`/v1/boards/${boardId}/members/${userId}`, {
    method: "DELETE",
    errorMessage: "Falha ao remover membro do board",
  });
}

export async function updateBoardMemberRole(
  boardId: string,
  userId: string,
  role: BoardRole,
) {
  return apiClient(`/v1/boards/${boardId}/members/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
    errorMessage: "Falha ao atualizar papel do membro",
  });
}

export async function inviteBoardMember(
  boardId: string,
  userName: string,
  role: BoardRole = BoardRole.OBSERVER,
) {
  return apiClient(`/v1/boards/invite/${boardId}`, {
    method: "POST",
    body: JSON.stringify({ userName, role }),
    errorMessage: "Falha ao enviar convite",
  });
}

export async function respondInvite(boardId: string, idInvite: string, accept: boolean) {
  return apiClient(`/v1/boards/invite/${boardId}/response`, {
    method: "POST",
    body: JSON.stringify({ idInvite, response: accept }),
    errorMessage: accept ? "Falha ao aceitar convite" : "Falha ao recusar convite",
  });
}