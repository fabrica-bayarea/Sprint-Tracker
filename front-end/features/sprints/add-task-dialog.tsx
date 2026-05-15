"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Plus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllList } from "@/lib/actions/list";
import { addTaskToSprint } from "@/lib/actions/sprint";
import type { Task } from "@/types/task";

interface AddTaskDialogProps {
  boardId: string;
  sprintId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddTaskDialog({
  boardId,
  sprintId,
  isOpen,
  onClose,
}: AddTaskDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["board-lists", boardId],
    queryFn: () => getAllList(boardId),
    enabled: isOpen && !!boardId,
  });

  const candidates = useMemo<Task[]>(() => {
    if (!data?.success || !data.data) return [];
    const allTasks: Task[] = data.data.flatMap((l) => l.tasks ?? []);
    // Só tasks sem sprint atribuída e não arquivadas
    return allTasks.filter((t) => !t.sprintId && t.status !== "ARCHIVED");
  }, [data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return candidates;
    return candidates.filter((t) =>
      [t.title, t.description].some((field) =>
        field?.toLowerCase().includes(term),
      ),
    );
  }, [candidates, search]);

  async function handleAdd(task: Task) {
    setAdding(task.id);
    const r = await addTaskToSprint(sprintId, task.id);
    setAdding(null);
    if (r.success) {
      queryClient.invalidateQueries({ queryKey: ["sprint-active", boardId] });
      queryClient.invalidateQueries({ queryKey: ["board-lists", boardId] });
      toast.success(`"${task.title}" adicionada à sprint`);
    } else {
      toast.error(r.error || "Erro ao adicionar");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar task à sprint</DialogTitle>
          <DialogDescription>
            Selecione uma task do board que ainda não está em sprint.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por título…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
            {isLoading ? (
              <div className="text-xs text-muted-foreground py-6 text-center">
                Carregando…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-xs text-muted-foreground italic py-6 text-center">
                {candidates.length === 0
                  ? "Sem tasks elegíveis (todas já estão em uma sprint ou arquivadas)"
                  : "Nenhuma task casa com a busca"}
              </div>
            ) : (
              filtered.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {t.title}
                    </p>
                    {t.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAdd(t)}
                    disabled={adding === t.id}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Plus size={14} className="mr-1" />
                    {adding === t.id ? "..." : "Adicionar"}
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
