"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BacklogTask } from "@/lib/actions/backlog";

const getStatusConfig = (status: string) => {
  const s = status?.toUpperCase() || "";
  if (s === "TODO") return { color: "bg-slate-400 dark:bg-slate-500", text: "A fazer" };
  if (s === "IN_PROGRESS") return { color: "bg-amber-500", text: "Em progresso" };
  if (s === "DONE") return { color: "bg-emerald-500", text: "Concluído" };
  if (s === "ARCHIVED") return { color: "bg-zinc-400 dark:bg-zinc-500", text: "Arquivada" };
  return { color: "bg-muted-foreground/40", text: status };
};

function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch {
    return "—";
  }
}

export const getBacklogColumns = (): ColumnDef<BacklogTask>[] => [
  {
    accessorKey: "title",
    header: "Tarefa",
    cell: ({ row }) => (
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-sm text-foreground truncate">
          {row.getValue("title")}
        </span>
        {row.original.description && (
          <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {row.original.description}
          </span>
        )}
      </div>
    ),
  },
  {
    id: "board",
    header: "Board",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.list?.board?.title ?? "—"}
      </span>
    ),
  },
  {
    id: "list",
    header: "Lista",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.list?.title ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { color, text } = getStatusConfig(row.getValue("status") as string);
      return (
        <div className="flex items-center gap-2 text-sm">
          <div className={`h-2 w-2 rounded-full ${color}`} />
          {text}
        </div>
      );
    },
  },
  {
    accessorKey: "assignee",
    header: "Responsável",
    cell: ({ row }) => {
      const a = row.original.assignee;
      if (!a) return <span className="text-xs text-muted-foreground italic">—</span>;
      const name = a.name || a.userName || a.email || "Usuário";
      const initial = (name[0] || "?").toUpperCase();
      return (
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 flex items-center justify-center font-semibold text-[10px]">
            {initial}
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
            {name}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "dueDate",
    header: "Vencimento",
    cell: ({ row }) => {
      const due = row.getValue("dueDate") as string | null | undefined;
      const overdue = due && new Date(due).getTime() < Date.now();
      return (
        <span className={`text-xs ${overdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}`}>
          {formatDate(due)}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const boardId = row.original.list?.board?.id;
      if (!boardId) return null;
      return (
        <div className="text-right">
          <Button asChild variant="ghost" size="sm" className="h-7">
            <Link href={`/dashboard/board/${boardId}`}>
              <ExternalLink size={14} />
            </Link>
          </Button>
        </div>
      );
    },
  },
];
