'use server';

import api from "@/lib/api/axios";
import { handleAxiosError } from "@/lib/utils/handle-axios-error";
import { validateId } from "@/lib/utils/validateId";

export interface BoardMember {
  userId: string;
  role: 'ADMIN' | 'MEMBER' | 'OBSERVER';
  joinedAt?: string;
  user: {
    id: string;
    name: string | null;
    userName: string | null;
    email: string | null;
    image?: string | null;
  };
}

export type MyRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'OBSERVER' | null;

export async function getBoardMembers(boardId: string) {
  try {
    const safeId = validateId(boardId, 'boardId');
    const response = await api.get(`/v1/boards/${safeId}/members`);
    return { success: true as const, data: response.data as BoardMember[] };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao buscar membros"),
    };
  }
}

export async function inviteBoardMember(
  boardId: string,
  email: string,
  role: 'ADMIN' | 'MEMBER' | 'OBSERVER' = 'MEMBER',
) {
  try {
    const safeId = validateId(boardId, 'boardId');
    const response = await api.post(`/v1/boards/${safeId}/members`, { email, role });
    return { success: true as const, data: response.data };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao adicionar membro"),
    };
  }
}

export async function removeBoardMember(boardId: string, userId: string) {
  try {
    const safeBoardId = validateId(boardId, 'boardId');
    const safeUserId = validateId(userId, 'userId');
    const response = await api.delete(`/v1/boards/${safeBoardId}/members/${safeUserId}`);
    return { success: true as const, data: response.data };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao remover membro"),
    };
  }
}

export async function changeBoardMemberRole(
  boardId: string,
  userId: string,
  role: 'ADMIN' | 'MEMBER' | 'OBSERVER',
) {
  try {
    const safeBoardId = validateId(boardId, 'boardId');
    const safeUserId = validateId(userId, 'userId');
    const response = await api.patch(
      `/v1/boards/${safeBoardId}/members/${safeUserId}/role`,
      { role },
    );
    return { success: true as const, data: response.data };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao alterar role do membro"),
    };
  }
}

export async function getMyRoleOnBoard(boardId: string) {
  try {
    const safeId = validateId(boardId, 'boardId');
    const response = await api.get(`/v1/boards/${safeId}/my-role`);
    // Backend retorna a role como string ("OWNER" | "ADMIN" | ...) ou null.
    // Normaliza para { role } pra ficar consistente no consumo.
    const raw = response.data as MyRole | { role: MyRole } | null;
    const role: MyRole =
      raw && typeof raw === 'object' && 'role' in raw
        ? (raw.role as MyRole)
        : (raw as MyRole);
    return { success: true as const, data: { role } };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao obter papel no board"),
    };
  }
}
