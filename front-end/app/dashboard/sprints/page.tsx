"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Calendar,
  Target,
  X,
  ExternalLink,
  Gauge,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useBoardStore } from "@/stores/use-board-store";
import {
  getActiveSprint,
  updateSprint,
  removeTaskFromSprint,
  type SprintTask,
  type ActiveSprint,
} from "@/lib/actions/sprint";
import { CreateSprintDialog } from "@/features/sprints/create-sprint-dialog";
import { AddTaskDialog } from "@/features/sprints/add-task-dialog";

type Bucket = "TODO" | "IN_PROGRESS" | "DONE";

const BUCKETS: { key: Bucket; label: string; className: string }[] = [
  {
    key: "TODO",
    label: "A fazer",
    className:
      "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200",
  },
  {
    key: "IN_PROGRESS",
    label: "Em progresso",
    className:
      "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  },
  {
    key: "DONE",
    label: "Concluído",
    className:
      "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  },
];

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

export default function SprintsPage() {
  const { selectedBoardId } = useBoardStore();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["sprint-active", selectedBoardId],
    queryFn: () => getActiveSprint(selectedBoardId!),
    enabled: !!selectedBoardId,
    staleTime: 15_000,
  });

  const sprint: ActiveSprint | null = data?.success ? data.data : null;

  const grouped = useMemo(() => {
    const out: Record<Bucket, SprintTask[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    };
    if (!sprint) return out;
    for (const t of sprint.tasks) {
      const bucket = (BUCKETS.find((b) => b.key === t.status)?.key ??
        "TODO") as Bucket;
      out[bucket].push(t);
    }
    return out;
  }, [sprint]);

  async function handleCloseSprint() {
    if (!sprint) return;
    if (!confirm(`Encerrar a sprint "${sprint.name}"?`)) return;
    setClosing(true);
    const r = await updateSprint(sprint.id, { status: "COMPLETED" });
    setClosing(false);
    if (r.success) {
      queryClient.invalidateQueries({
        queryKey: ["sprint-active", selectedBoardId],
      });
      queryClient.invalidateQueries({
        queryKey: ["sprints", selectedBoardId],
      });
      toast.success("Sprint encerrada");
    } else {
      toast.error(r.error || "Erro ao encerrar");
    }
  }

  async function handleRemoveTask(task: SprintTask) {
    if (!sprint) return;
    const r = await removeTaskFromSprint(sprint.id, task.id);
    if (r.success) {
      queryClient.invalidateQueries({
        queryKey: ["sprint-active", selectedBoardId],
      });
      toast.success(`"${task.title}" removida da sprint`);
    } else {
      toast.error(r.error || "Erro ao remover");
    }
  }

  // No board selecionado
  if (!selectedBoardId) {
    return (
      <div className="w-full p-10">
        <div className="max-w-md mx-auto mt-16 flex flex-col items-center text-center bg-muted/20 border border-dashed border-border rounded-lg p-10">
          <Gauge size={26} className="text-muted-foreground mb-3" />
          <h1 className="text-xl font-semibold text-foreground">
            Escolha um board
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sprints são organizadas por board. Selecione um na sidebar
            primeiro.
          </p>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="w-full p-10">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Sem sprint ativa
  if (!sprint) {
    return (
      <div className="w-full p-10">
        <div className="max-w-md mx-auto mt-16 flex flex-col items-center text-center bg-muted/20 border border-dashed border-border rounded-lg p-10">
          <Gauge size={26} className="text-red-600 dark:text-red-400 mb-3" />
          <h1 className="text-xl font-semibold text-foreground">
            Nenhuma sprint ativa
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Crie uma sprint pra começar a planejar o próximo ciclo.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="mt-6 bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus size={14} className="mr-1" />
            Criar sprint
          </Button>
        </div>

        <CreateSprintDialog
          boardId={selectedBoardId}
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      </div>
    );
  }

  // Sprint ativa: header + kanban
  return (
    <div className="w-full p-10 space-y-6">
      {/* Header da sprint */}
      <div className="rounded-xl bg-card shadow-sm border border-border p-6 flex flex-col md:flex-row md:items-start gap-4 justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
              Ativa
            </span>
            <h1 className="text-xl font-semibold text-foreground leading-tight truncate">
              {sprint.name}
            </h1>
          </div>
          {sprint.goal ? (
            <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1.5">
              <Target size={14} className="mt-0.5 flex-shrink-0" />
              <span>{sprint.goal}</span>
            </p>
          ) : null}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
            </span>
            <span>·</span>
            <span>
              {sprint.tasks.length}{" "}
              {sprint.tasks.length === 1 ? "task" : "tasks"}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddTaskOpen(true)}
          >
            <Plus size={14} className="mr-1" />
            Adicionar task
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleCloseSprint}
            disabled={closing}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <CheckCircle2 size={14} className="mr-1" />
            {closing ? "Encerrando..." : "Encerrar sprint"}
          </Button>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BUCKETS.map((bucket) => {
          const tasks = grouped[bucket.key];
          return (
            <div
              key={bucket.key}
              className="flex flex-col bg-muted/40 rounded-xl border border-border p-3"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm ${bucket.className}`}
                >
                  {bucket.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tasks.length}
                </span>
              </div>

              <div className="space-y-2 min-h-[120px]">
                {tasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic px-1 py-4 text-center">
                    Nenhuma task aqui
                  </p>
                ) : (
                  tasks.map((task) => (
                    <SprintTaskCard
                      key={task.id}
                      task={task}
                      boardId={selectedBoardId}
                      onRemove={() => handleRemoveTask(task)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AddTaskDialog
        boardId={selectedBoardId}
        sprintId={sprint.id}
        isOpen={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
      />
    </div>
  );
}

function SprintTaskCard({
  task,
  boardId,
  onRemove,
}: {
  task: SprintTask;
  boardId: string;
  onRemove: () => void;
}) {
  const assigneeName =
    task.assignee?.name ||
    task.assignee?.userName ||
    task.assignee?.email ||
    null;
  const initial = assigneeName ? assigneeName[0]?.toUpperCase() : null;

  return (
    <div className="bg-card rounded-lg border border-border p-3 shadow-sm hover:border-red-600/40 transition-colors group">
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {task.labels.map((tl) =>
            tl.label ? (
              <span
                key={tl.labelId}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white truncate max-w-[120px]"
                style={{ backgroundColor: tl.label.color }}
                title={tl.label.name}
              >
                {tl.label.name}
              </span>
            ) : null,
          )}
        </div>
      )}
      <div className="flex items-start gap-2">
        <p className="text-sm font-medium text-foreground line-clamp-2 flex-1">
          {task.title}
        </p>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/dashboard/board/${boardId}`}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="Abrir no board"
            title="Abrir no board"
          >
            <ExternalLink size={12} />
          </Link>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-muted-foreground hover:text-red-600"
            aria-label="Remover da sprint"
            title="Remover da sprint"
          >
            <X size={12} />
          </button>
        </div>
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center justify-between mt-2 text-[11px]">
        <span className="text-muted-foreground/80 truncate">
          {task.list?.title}
        </span>
        {initial ? (
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 flex items-center justify-center font-semibold text-[10px]">
              {initial}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
