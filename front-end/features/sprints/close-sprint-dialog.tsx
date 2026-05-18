"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  closeSprint,
  listSprints,
  type IncompleteTasksAction,
} from "@/lib/actions/sprint";

interface CloseSprintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sprintId: string;
  sprintName: string;
  boardId: string;
  incompleteCount: number;
}

export function CloseSprintDialog({
  isOpen,
  onClose,
  sprintId,
  sprintName,
  boardId,
  incompleteCount,
}: CloseSprintDialogProps) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<IncompleteTasksAction>("MOVE_TO_NEXT");
  const [targetSprintId, setTargetSprintId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { data: sprintsData } = useQuery({
    queryKey: ["sprints", boardId],
    queryFn: () => listSprints(boardId),
    enabled: isOpen && !!boardId,
    staleTime: 5_000,
  });

  const plannedSprints =
    sprintsData?.success && sprintsData.data
      ? sprintsData.data.filter(
          (s) => s.status === "PLANNED" && s.id !== sprintId,
        )
      : [];

  // Se não há sprint PLANNED, "mover pra próxima" não faz sentido —
  // default volta pra "voltar pro backlog".
  useEffect(() => {
    if (isOpen && plannedSprints.length === 0 && action === "MOVE_TO_NEXT") {
      setAction("RETURN_TO_BACKLOG");
    }
  }, [isOpen, plannedSprints.length, action]);

  // Quando a lista carrega e ainda não escolheu target, pré-seleciona o primeiro.
  useEffect(() => {
    if (
      action === "MOVE_TO_NEXT" &&
      !targetSprintId &&
      plannedSprints.length > 0
    ) {
      setTargetSprintId(plannedSprints[0].id);
    }
  }, [action, targetSprintId, plannedSprints]);

  async function handleSubmit() {
    if (action === "MOVE_TO_NEXT" && !targetSprintId) {
      toast.error("Selecione a sprint de destino");
      return;
    }
    setLoading(true);
    const r = await closeSprint(sprintId, {
      incompleteTasksAction: action,
      targetSprintId:
        action === "MOVE_TO_NEXT" ? targetSprintId : undefined,
    });
    setLoading(false);

    if (r.success) {
      queryClient.invalidateQueries({ queryKey: ["sprint-active", boardId] });
      queryClient.invalidateQueries({ queryKey: ["sprints", boardId] });
      queryClient.invalidateQueries({
        queryKey: ["sprint-history", boardId],
      });
      const msg =
        r.data.incompleteTaskCount === 0
          ? "Sprint encerrada"
          : action === "MOVE_TO_NEXT"
            ? `Sprint encerrada. ${r.data.incompleteTaskCount} tarefa(s) movida(s) pra próxima sprint.`
            : action === "RETURN_TO_BACKLOG"
              ? `Sprint encerrada. ${r.data.incompleteTaskCount} tarefa(s) voltaram pro backlog.`
              : `Sprint encerrada. ${r.data.incompleteTaskCount} tarefa(s) ficaram na sprint.`;
      toast.success(msg);
      onClose();
    } else {
      toast.error(r.error || "Erro ao encerrar sprint");
    }
  }

  const noPlanned = plannedSprints.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Encerrar sprint &quot;{sprintName}&quot;</DialogTitle>
          <DialogDescription>
            {incompleteCount > 0
              ? `Você tem ${incompleteCount} tarefa(s) não concluída(s). Decide o que fazer com elas:`
              : "Tudo foi concluído nesta sprint."}
          </DialogDescription>
        </DialogHeader>

        {incompleteCount > 0 && (
          <div className="space-y-3 mt-2">
            <label className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/40 has-checked:border-red-500 has-checked:bg-red-50 dark:has-checked:bg-red-950/20">
              <input
                type="radio"
                name="close-action"
                value="MOVE_TO_NEXT"
                checked={action === "MOVE_TO_NEXT"}
                onChange={() => setAction("MOVE_TO_NEXT")}
                disabled={noPlanned}
                className="mt-1 accent-red-600"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">
                  Mover pra próxima sprint
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {noPlanned
                    ? "Nenhuma sprint PLANNED disponível neste board."
                    : "Tasks não concluídas viram parte da próxima sprint."}
                </div>
                {action === "MOVE_TO_NEXT" && !noPlanned && (
                  <div className="mt-2">
                    <Select
                      value={targetSprintId}
                      onValueChange={setTargetSprintId}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Escolha a sprint de destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {plannedSprints.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/40 has-checked:border-red-500 has-checked:bg-red-50 dark:has-checked:bg-red-950/20">
              <input
                type="radio"
                name="close-action"
                value="RETURN_TO_BACKLOG"
                checked={action === "RETURN_TO_BACKLOG"}
                onChange={() => setAction("RETURN_TO_BACKLOG")}
                className="mt-1 accent-red-600"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">Voltar pro backlog</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Tasks ficam sem sprint, prontas pra serem repriorizadas.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/40 has-checked:border-red-500 has-checked:bg-red-50 dark:has-checked:bg-red-950/20">
              <input
                type="radio"
                name="close-action"
                value="KEEP"
                checked={action === "KEEP"}
                onChange={() => setAction("KEEP")}
                className="mt-1 accent-red-600"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">
                  Deixar nesta sprint
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Tasks ficam paradas na sprint encerrada (não recomendado).
                </div>
              </div>
            </label>

            {noPlanned && action !== "RETURN_TO_BACKLOG" && (
              <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>
                  Pra usar &quot;mover pra próxima sprint&quot; voce precisa
                  ter pelo menos uma sprint PLANNED criada neste board.
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Encerrando..." : "Encerrar sprint"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
