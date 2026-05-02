"use server";

import { apiClient } from "@/lib/utils/apiClient";

export interface StatusCount {
  status: string;
  count: number;
  percentage: number;
}

export interface BasicSummaryResponse {
  total: number;
  statusCounts: StatusCount[];
}

export interface DailyCompletedCount {
  date: string;
  count: number;
}

export interface CompletedSummaryResponse {
  total: number;
  dailyCounts: DailyCompletedCount[];
}

export async function getBasicSummary(boardId: string) {
  return apiClient<BasicSummaryResponse>(`/v1/analysis/${boardId}`, {
    method: "GET",
    errorMessage: "Erro ao buscar resumo básico",
  });
}

export async function getCompletedTasksSummary(
  boardId: string,
  startDate: string,
  endDate: string,
  userId?: string
) {
  const params = new URLSearchParams({
    startDate,
    endDate,
    ...(userId && { userId })
  });

  return apiClient<CompletedSummaryResponse>(
    `/v1/analysis/completed/${boardId}?${params.toString()}`, 
    {
      method: "GET",
      errorMessage: "Erro ao buscar relatório de tarefas concluídas",
    }
  );
}
