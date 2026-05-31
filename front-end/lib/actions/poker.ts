"use server";

import api from "@/lib/api/axios";
import { handleAxiosError } from "@/lib/utils/handle-axios-error";
import { validateId } from "@/lib/utils/validateId";

export interface PokerTask {
  id: string;
  title: string;
}

export interface PokerSession {
  id: string;
  boardId: string;
  title: string;
  taskIds: string[];
  task?: PokerTask | null;
  pokerStatus: string;
  participantCount: number;
  createdAt: string;
}

export async function createPokerSession(boardId: string, taskIds: string[]) {
  try {
    const safeBoardId = validateId(boardId, "boardId");
    const safeTaskId = taskIds.length > 0 ? validateId(taskIds[0], "taskId[0]") : undefined;
    
    // O backend espera { title, status, taskId } no endpoint /v1/poker/create/:boardId
    const response = await api.post(
      `/v1/poker/create/${safeBoardId}`,
      { 
        title: "Sessão de Refinamento", 
        status: "WAITING", 
        taskId: safeTaskId 
      },
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
    const safeSessionId = validateId(sessionId, "sessionId");
    const response = await api.get(
      `/v1/poker/${safeSessionId}`,
    );
    return { success: true as const, data: response.data as PokerSession };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Erro ao carregar sessão de Poker Planning"),
    };
  }
}

export async function listPokerSessions(boardId: string) {
  try {
    const safeBoardId = validateId(boardId, "boardId");
    const response = await api.get(`/v1/poker/board/${safeBoardId}`);
    return { success: true as const, data: response.data as PokerSession[] };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Erro ao listar sessões"),
    };
  }
}

export async function votePokerSession(sessionId: string, value: string) {
  try {
    const response = await api.post(`/v1/poker/vote/${sessionId}`, { sessionId, value });
    return { success: true as const, data: response.data };
  } catch (error) {
    return { success: false as const, error: handleAxiosError(error, "Erro ao votar") };
  }
}

export async function revealPokerSession(sessionId: string) {
  try {
    const response = await api.post(`/v1/poker/reveal/${sessionId}`);
    return { success: true as const, data: response.data };
  } catch (error) {
    return { success: false as const, error: handleAxiosError(error, "Erro ao revelar cartas") };
  }
}

export async function nextCardPokerSession(sessionId: string) {
  try {
    const response = await api.post(`/v1/poker/next/${sessionId}`);
    return { success: true as const, data: response.data };
  } catch (error) {
    return { success: false as const, error: handleAxiosError(error, "Erro ao avançar rodada") };
  }
}

export async function closePokerSession(sessionId: string) {
  try {
    const response = await api.post(`/v1/poker/close/${sessionId}`);
    return { success: true as const, data: response.data };
  } catch (error) {
    return { success: false as const, error: handleAxiosError(error, "Erro ao encerrar sessão") };
  }
}

export async function startPokerSession(sessionId: string) {
  try {
    const response = await api.post(`/v1/poker/start/${sessionId}`);
    return { success: true as const, data: response.data };
  } catch (error) {
    return { success: false as const, error: handleAxiosError(error, "Erro ao iniciar sessão") };
  }
}