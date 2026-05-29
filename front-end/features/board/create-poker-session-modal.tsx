"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dices, Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getActiveSprint, type SprintTask } from "@/lib/actions/sprint";
import { createPokerSession } from "@/lib/actions/poker";

interface CreatePokerSessionModalProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  initialTaskId?: string;
}

export function CreatePokerSessionModal({
  boardId,
  isOpen,
  onClose,
  initialTaskId,
}: CreatePokerSessionModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    initialTaskId ? new Set([initialTaskId]) : new Set(),
  );
  const [loading, setLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["sprint-active", boardId],
    queryFn: () => getActiveSprint(boardId),
    enabled: isOpen && !!boardId,
    staleTime: 15_000,
  });

  const sprintTasks: SprintTask[] = useMemo(() => {
    if (!data?.success || !data.data) return [];
    return data.data.tasks;
  }, [data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sprintTasks;
    return sprintTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term),
    );
  }, [sprintTasks, search]);

  function toggleTask(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((t) => t.id)));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedIds.size === 0) return;
    setLoading(true);
    const result = await createPokerSession(boardId, Array.from(selectedIds));
    setLoading(false);

    if (!result.success) {
      toast.error(result.error || "Erro ao criar sessão");
      return;
    }

    onClose();
    router.push(`/dashboard/board/${boardId}/poker/${result.data.id}`);
  }

  const allSelected =
    filtered.length > 0 && filtered.every((t) => selectedIds.has(t.id));
  const hasNoSprint = !isLoading && data?.success && !data.data;
  const hasTasks = sprintTasks.length > 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
              <Dices size={16} className="text-violet-600 dark:text-violet-400" />
            </div>
            <DialogTitle>Poker Planning</DialogTitle>
          </div>
          <DialogDescription>
            Selecione as tasks da sprint ativa que serão estimadas na sessão.
          </DialogDescription>
        </DialogHeader>

        {hasNoSprint ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma sprint ativa. Adicione tasks a uma sprint antes de iniciar
              uma sessão de Poker Planning.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {hasTasks && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar tasks..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Carregando tasks da sprint...
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground italic">
                  {hasTasks
                    ? "Nenhuma task casa com a busca"
                    : "A sprint ativa não possui tasks. Adicione tasks à sprint primeiro."}
                </div>
              ) : (
                <>
                  {filtered.length > 1 && (
                    <label className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted/40 transition-colors border-b border-border mb-1">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleAll}
                        className="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        Selecionar todas ({filtered.length})
                      </span>
                    </label>
                  )}
                  {filtered.map((task) => (
                    <label
                      key={task.id}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-border cursor-pointer hover:bg-muted/30 transition-colors has-checked:border-violet-400 has-checked:bg-violet-50 dark:has-checked:bg-violet-950/20"
                    >
                      <Checkbox
                        checked={selectedIds.has(task.id)}
                        onCheckedChange={() => toggleTask(task.id)}
                        className="mt-0.5 shrink-0 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {task.description}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                          {task.list?.title}
                        </p>
                      </div>
                    </label>
                  ))}
                </>
              )}
            </div>

            {selectedIds.size > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedIds.size}{" "}
                {selectedIds.size === 1 ? "task selecionada" : "tasks selecionadas"}
              </p>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || selectedIds.size === 0}
                className="bg-violet-600 hover:bg-violet-700 text-white w-full sm:w-auto gap-2"
              >
                <Dices size={15} />
                {loading ? "Criando sessão..." : "Iniciar sessão"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
