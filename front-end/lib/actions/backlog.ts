"use server";

import api from "@/lib/api/axios";
import { handleAxiosError } from "@/lib/utils/handle-axios-error";
import type { Task } from "@/types/task";

/** Task no contexto do backlog inclui informações da list e board */
export interface BacklogTask extends Task {
  list: {
    id: string;
    title: string;
    board: {
      id: string;
      title: string;
    };
  };
  assignee?: {
    id: string;
    name: string | null;
    userName: string | null;
    email: string | null;
  } | null;
}

/**
 * Backlog = agregado de todas as tasks dos boards visíveis ao usuário.
 * Retorna tasks ordenadas por updatedAt desc.
 */
export async function getMyTasks() {
  try {
    const response = await api.get("/v1/me/tasks");
    return { success: true as const, data: response.data as BacklogTask[] };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Erro ao buscar backlog"),
    };
  }
}
