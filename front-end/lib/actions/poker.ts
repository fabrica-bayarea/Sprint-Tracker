"use server";

import api from "@/lib/api/axios";
import { handleAxiosError } from "@/lib/utils/handle-axios-error";
import { validateId } from "@/lib/utils/validateId";

export interface PokerSession {
  id: string;
  boardId: string;
  taskIds: string[];
  createdAt: string;
}

export async function createPokerSession(boardId: string, taskIds: string[]) {
  try {
    const safeBoardId = validateId(boardId, "boardId");
    const safeTaskIds = taskIds.map((id, i) => validateId(id, `taskId[${i}]`));
    const response = await api.post(
      `/v1/boards/${safeBoardId}/poker-sessions`,
      { taskIds: safeTaskIds },
    );
    const data = response.data as PokerSession;
    const safeSessionId = validateId(data.id, "sessionId");
    return { success: true as const, data: { ...data, id: safeSessionId } };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Erro ao criar sessão de Poker Planning"),
    };
  }
}

export async function getPokerSession(boardId: string, sessionId: string) {
  try {
    const safeBoardId = validateId(boardId, "boardId");
    const safeSessionId = validateId(sessionId, "sessionId");
    const response = await api.get(
      `/v1/boards/${safeBoardId}/poker-sessions/${safeSessionId}`,
    );
    return { success: true as const, data: response.data as PokerSession };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Erro ao carregar sessão de Poker Planning"),
    };
  }
}
