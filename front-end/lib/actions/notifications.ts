'use server';

import api from "@/lib/api/axios";
import { handleAxiosError } from "@/lib/utils/handle-axios-error";
import { validateId } from "@/lib/utils/validateId";

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface InviteNotification {
  id: string;
  createdAt: string;
  statusInvite: InviteStatus;
  role: 'ADMIN' | 'MEMBER' | 'OBSERVER';
  sender: {
    id: string;
    name: string | null;
    userName: string | null;
  };
  board: {
    id: string;
    title: string;
  };
}

export async function getNotifications() {
  try {
    const response = await api.get('/v1/me/notifications');
    const data = response.data as InviteNotification[];
    return { success: true as const, data };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao buscar notificações"),
    };
  }
}

export async function respondInvite(
  boardId: string,
  idInvite: string,
  accept: boolean,
) {
  try {
    const safeBoardId = validateId(boardId, 'boardId');
    const safeInviteId = validateId(idInvite, 'idInvite');
    const response = await api.post(
      `/v1/boards/invite/${safeBoardId}/response`,
      { idInvite: safeInviteId, response: accept },
    );
    return { success: true as const, data: response.data };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Falha ao responder convite"),
    };
  }
}
