"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createSprint, updateSprint } from "@/lib/actions/sprint";
import { cn } from "@/lib/utils";

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
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startNow, setStartNow] = useState(true);
  const [loading, setLoading] = useState(false);

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  function reset() {
    setName("");
    setGoal("");
    setStartDate(new Date());
    setEndDate(undefined);
    setStartNow(true);
    setIsStartOpen(false);
    setIsEndOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    setLoading(true);
    const created = await createSprint(boardId, {
      name: name.trim(),
      goal: goal.trim() || undefined,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    if (!created.success) {
      setLoading(false);
      toast.error(created.error || "Erro ao criar sprint");
      return;
    }

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
        "Sprint criada como planejada. Já existe outra sprint ativa neste board."
      );
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2 flex flex-col">
              <Label>Início</Label>
              <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setIsStartOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2 flex flex-col">
              <Label>Fim</Label>
              <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setIsEndOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
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
              className="mt-0.5 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 shrink-0"
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

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
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
