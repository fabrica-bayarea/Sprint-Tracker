"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllList } from "@/lib/actions/list";
import { getBoards } from "@/lib/actions/board";
import { addTaskToSprint } from "@/lib/actions/sprint";
import type { Task } from "@/types/task";

interface AddTaskDialogProps {
  /** Board padrão (o selecionado na sidebar). O usuário pode trocar. */
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
  // Board que está sendo navegado (multi-board: dá pra puxar de vários).
  const [browseBoardId, setBrowseBoardId] = useState(boardId);

  useEffect(() => {
    if (boardId) setBrowseBoardId(boardId);
  }, [boardId]);

  const { data: boardsData } = useQuery({
    queryKey: ["boards"],
    queryFn: getBoards,
    enabled: isOpen,
    staleTime: 30_000,
  });
  const boards =
    boardsData?.success && boardsData.data ? boardsData.data : [];

  const { data, isLoading } = useQuery({
    queryKey: ["board-lists", browseBoardId],
    queryFn: () => getAllList(browseBoardId),
    enabled: isOpen && !!browseBoardId,
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
      // sprint-active é por-dono agora; invalida todas as variações
      queryClient.invalidateQueries({ queryKey: ["sprint-active"] });
      queryClient.invalidateQueries({
        queryKey: ["board-lists", browseBoardId],
      });
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
            Escolha um board e adicione tasks que ainda não estão em sprint.
            Você pode puxar de vários boards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Seletor de board (multi-board) */}
          <Select value={browseBoardId} onValueChange={setBrowseBoardId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Escolha o board" />
            </SelectTrigger>
            <SelectContent>
              {boards.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
                  ? "Sem tasks elegíveis neste board (todas já estão em uma sprint ou arquivadas)"
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
