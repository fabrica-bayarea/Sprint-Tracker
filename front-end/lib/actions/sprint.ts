"use server";

import api from "@/lib/api/axios";
import { handleAxiosError } from "@/lib/utils/handle-axios-error";
import { validateId } from "@/lib/utils/validateId";
import type { Task, TaskLabelLink } from "@/types/task";

export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export interface Sprint {
  id: string;
  boardId: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SprintListItem extends Sprint {
  _count: { tasks: number };
}

export interface SprintTask extends Task {
  assignee?: {
    id: string;
    name: string | null;
    userName: string | null;
    email: string | null;
  } | null;
  labels?: TaskLabelLink[];
  list: {
    id: string;
    title: string;
  };
}

export interface ActiveSprint extends Sprint {
  tasks: SprintTask[];
}

export interface HistorySprintTask {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "ARCHIVED";
  completedAt: string | null;
  assignee: {
    id: string;
    name: string | null;
    userName: string | null;
    email: string | null;
  } | null;
  list: { id: string; title: string };
}

export interface HistorySprint extends Sprint {
  completedTasks: HistorySprintTask[];
  incompleteTasks: HistorySprintTask[];
  stats: {
    total: number;
    completed: number;
    incomplete: number;
    completionRate: number;
  };
}

export async function listSprints(boardId: string) {
  try {
    const safeBoardId = validateId(boardId, "boardId");
    const response = await api.get(`/v1/boards/${safeBoardId}/sprints`);
    return { success: true as const, data: response.data as SprintListItem[] };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Erro ao listar sprints"),
    };
  }
}

export async function getActiveSprint(boardId: string) {
  try {
    const safeBoardId = validateId(boardId, "boardId");
    const response = await api.get(
      `/v1/boards/${safeBoardId}/sprints/active`,
    );
    return {
      success: true as const,
      data: response.data as ActiveSprint | null,
    };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Erro ao buscar sprint ativa"),
    };
  }
}

export async function getSprintHistory(boardId: string) {
  try {
    const safeBoardId = validateId(boardId, "boardId");
    const response = await api.get(
      `/v1/boards/${safeBoardId}/sprints/history`,
    );
    return { success: true as const, data: response.data as HistorySprint[] };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Erro ao buscar histórico de sprints"),
    };
  }
}

export async function createSprint(
  boardId: string,
  payload: { name: string; goal?: string; startDate: string; endDate: string },
) {
  try {
    const safeBoardId = validateId(boardId, "boardId");
    const response = await api.post(
      `/v1/boards/${safeBoardId}/sprints`,
      payload,
    );
    return { success: true as const, data: response.data as Sprint };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Erro ao criar sprint"),
    };
  }
}

export type IncompleteTasksAction =
  | "MOVE_TO_NEXT"
  | "RETURN_TO_BACKLOG"
  | "KEEP";

export interface CloseSprintResult {
  sprintId: string;
  status: "COMPLETED";
  incompleteTaskCount: number;
  action: IncompleteTasksAction;
  targetSprintId: string | null;
}

export async function closeSprint(
  sprintId: string,
  payload: {
    incompleteTasksAction: IncompleteTasksAction;
    targetSprintId?: string;
  },
) {
  try {
    const safeId = validateId(sprintId, "sprintId");
    const response = await api.post(`/v1/sprints/${safeId}/close`, payload);
    return { success: true as const, data: response.data as CloseSprintResult };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Erro ao encerrar sprint"),
    };
  }
}

export async function updateSprint(
  sprintId: string,
  payload: Partial<{
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
    status: SprintStatus;
  }>,
) {
  try {
    const safeId = validateId(sprintId, "sprintId");
    const response = await api.patch(`/v1/sprints/${safeId}`, payload);
    return { success: true as const, data: response.data as Sprint };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Erro ao atualizar sprint"),
    };
  }
}

export async function deleteSprint(sprintId: string) {
  try {
    const safeId = validateId(sprintId, "sprintId");
    const response = await api.delete(`/v1/sprints/${safeId}`);
    return { success: true as const, data: response.data };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Erro ao excluir sprint"),
    };
  }
}

export async function addTaskToSprint(sprintId: string, taskId: string) {
  try {
    const safeSprintId = validateId(sprintId, "sprintId");
    const safeTaskId = validateId(taskId, "taskId");
    const response = await api.post(
      `/v1/sprints/${safeSprintId}/tasks/${safeTaskId}`,
    );
    return { success: true as const, data: response.data };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Erro ao adicionar task à sprint"),
    };
  }
}

export async function removeTaskFromSprint(sprintId: string, taskId: string) {
  try {
    const safeSprintId = validateId(sprintId, "sprintId");
    const safeTaskId = validateId(taskId, "taskId");
    const response = await api.delete(
      `/v1/sprints/${safeSprintId}/tasks/${safeTaskId}`,
    );
    return { success: true as const, data: response.data };
  } catch (error) {
    return {
      success: false as const,
      error: handleAxiosError(error, "Erro ao remover task da sprint"),
    };
  }
}
