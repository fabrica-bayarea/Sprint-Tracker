"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createSprint, updateSprint } from "@/lib/actions/sprint";

interface CreateSprintDialogProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSprintDialog({
  boardId,
  isOpen,
  onClose,
}: CreateSprintDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startNow, setStartNow] = useState(true);
  const [loading, setLoading] = useState(false);

  function reset() {
    setName("");
    setGoal("");
    setStartDate("");
    setEndDate("");
    setStartNow(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    setLoading(true);
    const created = await createSprint(boardId, {
      name: name.trim(),
      goal: goal.trim() || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });

    if (!created.success) {
      setLoading(false);
      toast.error(created.error || "Erro ao criar sprint");
      return;
    }

    // Se o usuário desmarcou "Iniciar agora", deixa como PLANNED.
    // Senão tenta ativar. Backend bloqueia se já houver outra ACTIVE —
    // nesse caso fica como PLANNED mesmo e avisamos.
    const shouldActivate = startNow;
    const activated = shouldActivate
      ? await updateSprint(created.data.id, { status: "ACTIVE" })
      : null;
    setLoading(false);

    queryClient.invalidateQueries({ queryKey: ["sprint-active", boardId] });
    queryClient.invalidateQueries({ queryKey: ["sprints", boardId] });
    reset();
    onClose();

    if (!shouldActivate) {
      toast.success("Sprint planejada criada. Ative quando começar o ciclo.");
    } else if (activated?.success) {
      toast.success("Sprint criada e iniciada");
    } else {
      toast.warning(
        "Sprint criada como planejada. Já existe outra sprint ativa neste board.",
      );
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova sprint</DialogTitle>
          <DialogDescription>
            Por padrão a sprint já é iniciada. Desmarque pra criar apenas
            como planejada (pra uso futuro).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="sprint-name">Nome</Label>
            <Input
              id="sprint-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sprint 12 - Refatoração auth"
              required
              maxLength={80}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sprint-goal">Objetivo (opcional)</Label>
            <Textarea
              id="sprint-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="O que essa sprint deve entregar?"
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sprint-start">Início</Label>
              <Input
                id="sprint-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprint-end">Fim</Label>
              <Input
                id="sprint-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <label
            htmlFor="start-now"
            className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover:bg-muted/40 has-checked:border-red-500 has-checked:bg-red-50 dark:has-checked:bg-red-950/20"
          >
            <Checkbox
              id="start-now"
              checked={startNow}
              onCheckedChange={(c) => setStartNow(c === true)}
              className="mt-0.5 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
            />
            <div className="flex-1">
              <div className="font-medium text-sm">Iniciar sprint agora</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {startNow
                  ? "Sprint vira ativa imediatamente. Se já houver outra ativa, fica planejada."
                  : "Cria apenas como planejada. Útil pra preparar sprints futuras (ex: 'próxima sprint' no fechamento)."}
              </div>
            </div>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading
                ? "Criando..."
                : startNow
                  ? "Criar e iniciar"
                  : "Criar como planejada"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
