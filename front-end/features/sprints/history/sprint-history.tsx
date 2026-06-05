"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  History,
  FolderOpen,
  CheckCircle2,
  Circle,
  Calendar,
  Target,
  User,
  Gauge,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { useBoardStore } from "@/stores/use-board-store";
import {
  getSprintHistory,
  type HistorySprint,
  type HistorySprintTask,
} from "@/lib/actions/sprint";

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch {
    return d;
  }
}

function assigneeLabel(a: HistorySprintTask["assignee"]) {
  if (!a) return "Sem responsável";
  return a.name || a.userName || a.email || "—";
}

function TaskRow({
  task,
  done,
}: {
  task: HistorySprintTask;
  done: boolean;
}) {
  const Icon = done ? CheckCircle2 : Circle;
  return (
    <li className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/40">
      <Icon
        size={16}
        className={
          done
            ? "text-emerald-600 dark:text-emerald-400 shrink-0"
            : "text-muted-foreground shrink-0"
        }
      />
      <span
        className={`flex-1 text-sm ${done ? "line-through text-muted-foreground" : ""}`}
      >
        {task.title}
      </span>
      {task.list?.board?.title && (
        <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium hidden sm:inline">
          {task.list.board.title}
        </span>
      )}
      <span className="text-xs text-muted-foreground hidden md:flex items-center gap-1">
        <User size={12} />
        {assigneeLabel(task.assignee)}
      </span>
    </li>
  );
}

function SprintHistoryCard({ sprint }: { sprint: HistorySprint }) {
  const { stats, completedTasks, incompleteTasks } = sprint;
  return (
    <article className="rounded-lg border bg-card">
      <header className="p-5 border-b">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold">{sprint.name}</h2>
            {sprint.goal && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <Target size={14} />
                {sprint.goal}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
              <Calendar size={12} />
              {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">
              {stats.completionRate}%
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.completed} de {stats.total} concluídas
            </div>
          </div>
        </div>
        <div className="mt-4 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
        <section className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 mb-2">
            Concluídas ({completedTasks.length})
          </h3>
          {completedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-2">
              Nenhuma task concluída neste sprint.
            </p>
          ) : (
            <ul className="space-y-1">
              {completedTasks.map((t) => (
                <TaskRow key={t.id} task={t} done />
              ))}
            </ul>
          )}
        </section>

        <section className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-2">
            Não concluídas ({incompleteTasks.length})
          </h3>
          {incompleteTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-2">
              Tudo foi entregue neste sprint. 🎉
            </p>
          ) : (
            <ul className="space-y-1">
              {incompleteTasks.map((t) => (
                <TaskRow key={t.id} task={t} done={false} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </article>
  );
}

export function SprintHistory() {
  const { selectedBoardId } = useBoardStore();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["sprint-history", selectedBoardId],
    queryFn: () => getSprintHistory(selectedBoardId!),
    enabled: !!selectedBoardId,
    staleTime: 30_000,
  });

  const sprints: HistorySprint[] = data?.success ? data.data : [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sprints;
    return sprints
      .map((s) => ({
        ...s,
        completedTasks: s.completedTasks.filter((t) =>
          t.title.toLowerCase().includes(q),
        ),
        incompleteTasks: s.incompleteTasks.filter((t) =>
          t.title.toLowerCase().includes(q),
        ),
      }))
      .filter(
        (s) => s.completedTasks.length > 0 || s.incompleteTasks.length > 0,
      );
  }, [sprints, search]);

  if (!selectedBoardId) {
    return (
      <div className="max-w-md mx-auto mt-16 flex flex-col items-center text-center bg-muted/20 border border-dashed border-border rounded-lg p-10">
        <Gauge size={26} className="text-muted-foreground mb-3" />
        <h1 className="text-xl font-semibold">Escolha um board</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Sprints são organizadas por board. Selecione um na sidebar primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Histórico de Sprints
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Sprints encerradas — o que foi concluído e o que ficou pendente.
        </p>
      </div>

      <div className="relative flex items-center w-80 bg-muted rounded-lg">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Procurar tarefa..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-red-600/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {isLoading && (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && sprints.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 border border-dashed rounded-lg">
            <History className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum sprint encerrado</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Quando você encerrar uma sprint, ela aparece aqui com o que foi
              concluído e o que ficou pendente.
            </p>
          </div>
        )}

        {!isLoading && sprints.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 border border-dashed rounded-lg">
            <FolderOpen className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum resultado</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Não encontramos tarefa com &quot;{search}&quot;. Tente outro
              termo.
            </p>
          </div>
        )}

        {filtered.map((s) => (
          <SprintHistoryCard key={s.id} sprint={s} />
        ))}
      </div>
    </div>
  );
}
