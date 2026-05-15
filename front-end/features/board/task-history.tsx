"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Clock } from "lucide-react";

import { getTaskLogs, type LogAction, type TaskLog } from "@/lib/actions/taskLogs";

interface TaskHistoryProps {
  taskId: string;
  enabled: boolean;
}

function actionLabel(log: TaskLog): string {
  const meta = log.metadata as Record<string, unknown> | undefined;
  switch (log.action) {
    case "TASK_CREATED":
      return "criou a tarefa";
    case "TASK_UPDATED":
      return "editou os campos da tarefa";
    case "TASK_STATUS_CHANGED": {
      const from = (meta?.from as string) ?? "?";
      const to = (meta?.to as string) ?? "?";
      return `mudou o status de "${from}" para "${to}"`;
    }
    case "TASK_MOVED":
      return "moveu a tarefa para outra lista";
    case "TASK_ARCHIVED":
      return "arquivou a tarefa";
    case "TASK_DELETED":
      return "excluiu a tarefa";
    default:
      return log.action;
  }
}

function formatDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

const actionIconColor: Record<LogAction, string> = {
  TASK_CREATED: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  TASK_UPDATED: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200",
  TASK_STATUS_CHANGED: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  TASK_MOVED: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
  TASK_ARCHIVED: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300",
  TASK_DELETED: "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300",
};

export function TaskHistory({ taskId, enabled }: TaskHistoryProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["task-logs", taskId],
    queryFn: () => getTaskLogs(taskId),
    enabled: enabled && !!taskId,
    staleTime: 30_000,
  });

  if (!enabled) return null;

  const logs: TaskLog[] = data?.success ? data.data : [];

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={14} className="text-muted-foreground" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Histórico
        </h4>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Sem histórico registrado.</p>
      ) : (
        <ol className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {logs.map((log) => (
            <li key={log.id} className="flex items-start gap-2 text-xs">
              <span
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${actionIconColor[log.action]}`}
              >
                <Clock size={11} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-foreground">
                  <strong>{log.user.name || log.user.email || "Usuário"}</strong>{" "}
                  {actionLabel(log)}
                </p>
                <p className="text-muted-foreground mt-0.5">{formatDate(log.createdAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
