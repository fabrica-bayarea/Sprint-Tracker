"use client";

import { Calendar, User } from "lucide-react";

import type { Task } from "../../types/task";
import type { BoardMember } from "@/lib/actions/members";

interface TaskCardProps {
  task: Task;
  members: BoardMember[];
  onClick: () => void;
}

function formatDue(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusBadge: Record<string, { label: string; className: string }> = {
  TODO: { label: "A fazer", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  IN_PROGRESS: { label: "Em progresso", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  DONE: { label: "Concluído", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  ARCHIVED: { label: "Arquivada", className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
};

export function TaskCard({ task, members, onClick }: TaskCardProps) {
  const assignee = task.assigneeId
    ? members.find((m) => m.userId === task.assigneeId)?.user
    : null;
  const due = formatDue(task.dueDate);
  const overdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now();
  const badge = statusBadge[task.status] ?? statusBadge.TODO;

  function handleKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  }

  return (
    // div + role=button para que o pointerDown chegue limpo no Draggable
    // (botões nativos podem capturar pointer events de forma diferente em
    // alguns browsers, quebrando o início do drag).
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKey}
      className="cursor-grab active:cursor-grabbing w-full text-left rounded-lg border border-border bg-card p-3 shadow-sm hover:border-red-600/40 hover:shadow transition-all"
    >
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {task.labels.map((tl) =>
            tl.label ? (
              <span
                key={tl.labelId}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white truncate max-w-[140px]"
                style={{ backgroundColor: tl.label.color }}
                title={tl.label.name}
              >
                {tl.label.name}
              </span>
            ) : null,
          )}
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm text-foreground line-clamp-2 flex-1">
          {task.title}
        </p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.className}`}>
          {badge.label}
        </span>
      </div>
      {task.description ? (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
      ) : null}
      <div className="flex items-center justify-between mt-2 gap-2">
        {due ? (
          <div
            className={`flex items-center gap-1 text-[11px] ${
              overdue ? "text-red-600 font-medium" : "text-muted-foreground"
            }`}
          >
            <Calendar size={11} />
            {due}
          </div>
        ) : (
          <div />
        )}
        {assignee ? (
          <div
            className="flex items-center gap-1 text-[11px] text-muted-foreground"
            title={assignee.email || ""}
          >
            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 flex items-center justify-center font-semibold text-[10px]">
              {(assignee.name || assignee.userName || "?")[0]?.toUpperCase()}
            </div>
            <span className="truncate max-w-[100px]">
              {assignee.name || assignee.userName}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <User size={11} />
            Sem responsável
          </div>
        )}
      </div>
    </div>
  );
}
