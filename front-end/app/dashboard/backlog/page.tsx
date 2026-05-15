"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, ArchiveX, Loader2, ExternalLink } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/features/backlog/components/data-table";
import { getBacklogColumns } from "@/features/backlog/components/columns";
import { getMyTasks } from "@/lib/actions/backlog";

type StatusFilter = "ALL" | "TODO" | "IN_PROGRESS" | "DONE" | "ARCHIVED";

const STATUS_OPTIONS: { value: StatusFilter; label: string; className: string }[] = [
  { value: "ALL", label: "Todos", className: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200" },
  { value: "TODO", label: "A fazer", className: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200" },
  { value: "IN_PROGRESS", label: "Em progresso", className: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" },
  { value: "DONE", label: "Concluído", className: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" },
  { value: "ARCHIVED", label: "Arquivada", className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300" },
];

export default function BacklogPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const columns = getBacklogColumns();

  const { data, isLoading } = useQuery({
    queryKey: ["my-tasks"],
    queryFn: getMyTasks,
    staleTime: 30_000,
  });

  const tasks = data?.success ? data.data : [];

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (!term) return true;
      const inTitle = t.title?.toLowerCase().includes(term);
      const inDesc = t.description?.toLowerCase().includes(term);
      const inBoard = t.list?.board?.title?.toLowerCase().includes(term);
      return inTitle || inDesc || inBoard;
    });
  }, [tasks, search, statusFilter]);

  return (
    <div className="w-full space-y-6 p-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Backlog
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Todas as tarefas dos seus boards em um só lugar.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex items-center w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por título, descrição ou board…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-muted-foreground">Status:</span>
        {STATUS_OPTIONS.map((opt) => {
          const active = statusFilter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                active
                  ? `${opt.className} ring-2 ring-offset-1 ring-offset-background ring-red-600`
                  : `${opt.className} opacity-60 hover:opacity-100`
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
            <p className="text-muted-foreground text-sm">Carregando tarefas…</p>
          </div>
        )}

        {!isLoading && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 border border-dashed border-border rounded-lg">
            <ArchiveX className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">
              Backlog vazio
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Você ainda não tem tarefas em nenhum board. Crie ou entre em um
              board para começar.
            </p>
            <Button asChild className="mt-6 bg-red-600 hover:bg-red-700 text-white">
              <Link href="/dashboard">
                <ExternalLink size={14} className="mr-1" />
                Ir para os boards
              </Link>
            </Button>
          </div>
        )}

        {!isLoading && tasks.length > 0 && filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 border border-dashed border-border rounded-lg">
            <Search className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">
              Nenhum resultado
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Tente outro termo de busca ou mudar o filtro de status.
            </p>
          </div>
        )}

        {!isLoading && filteredTasks.length > 0 && (
          <div className="rounded-lg border border-border bg-card">
            <DataTable
              columns={columns}
              data={filteredTasks}
            />
          </div>
        )}
      </div>
    </div>
  );
}
