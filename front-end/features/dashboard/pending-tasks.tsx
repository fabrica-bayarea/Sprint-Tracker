"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AlertTriangle, Calendar, Clock } from "lucide-react";

import { getExpiredTasks } from "@/lib/actions/task";

interface ExpiredTaskAPI {
  id: string;
  title: string;
  status: string;
  dueDate?: string | null;
  listId: string;
  list?: {
    id: string;
    title: string;
    board?: {
      id: string;
      title: string;
    };
  };
  assignee?: {
    id: string;
    name: string | null;
    email?: string | null;
  } | null;
}

function formatDue(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PendingTasks() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["expired-tasks"],
    queryFn: getExpiredTasks,
    refetchInterval: 60_000, // re-poll a cada 60s
  });

  const tasks: ExpiredTaskAPI[] = (data?.success ? data.data : []) as ExpiredTaskAPI[];

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card shadow-sm border border-border p-6 mb-6">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        <div className="space-y-2 mt-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl bg-card shadow-sm border border-border overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-border flex items-center gap-2">
        <AlertTriangle size={18} className="text-amber-600" />
        <h2 className="text-base font-semibold text-foreground">
          Pendências ({tasks.length})
        </h2>
        <span className="text-xs text-muted-foreground ml-1">atrasadas ou vencendo em ≤12h</span>
      </div>
      <div className="divide-y divide-[#F1F5F9]">
        {tasks.map((t) => {
          const due = formatDue(t.dueDate);
          const overdue =
            t.dueDate && new Date(t.dueDate).getTime() < Date.now();
          const boardId = t.list?.board?.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => boardId && router.push(`/dashboard/board/${boardId}`)}
              className="w-full text-left flex items-center gap-3 px-6 py-3 hover:bg-red-100/30 dark:hover:bg-red-950/30 transition-colors"
            >
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  overdue ? "bg-red-500" : "bg-amber-500"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{t.title}</p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span className="truncate">
                    {t.list?.board?.title} / {t.list?.title}
                  </span>
                  {t.assignee?.name && (
                    <span className="italic">· {t.assignee.name}</span>
                  )}
                </div>
              </div>
              <div
                className={`flex items-center gap-1 text-xs flex-shrink-0 ${
                  overdue ? "text-red-600 font-medium" : "text-amber-700"
                }`}
              >
                {overdue ? <AlertTriangle size={12} /> : <Clock size={12} />}
                {due ? (
                  <span>{due}</span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />—
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
