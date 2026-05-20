"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createTask } from "@/lib/actions/task";
import { listSprints } from "@/lib/actions/sprint";
import type { BoardMember } from "@/lib/actions/members";
import { cn } from "@/lib/utils";

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  boardId: string;
  nextPosition: number;
  members?: BoardMember[];
  canAssign?: boolean;
}

const UNASSIGNED = "__unassigned__";
const NO_SPRINT = "__no_sprint__";

export function CreateTaskDialog({
  isOpen,
  onClose,
  listId,
  boardId,
  nextPosition,
  members = [],
  canAssign = false,
}: CreateTaskDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>(UNASSIGNED);
  const [sprintId, setSprintId] = useState<string>(NO_SPRINT);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: sprintsData } = useQuery({
    queryKey: ["sprints", boardId],
    queryFn: () => listSprints(boardId),
    enabled: isOpen && !!boardId,
    staleTime: 30_000,
  });

  const eligibleSprints =
    sprintsData?.success
      ? sprintsData.data.filter((s) => s.status !== "COMPLETED")
      : [];

  function reset() {
    setTitle("");
    setDescription("");
    setAssigneeId(UNASSIGNED);
    setSprintId(NO_SPRINT);
    setDueDate(undefined);
    setIsCalendarOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const result = await createTask({
      listId,
      title: title.trim(),
      description: description.trim() || undefined,
      position: nextPosition,
      status: "TODO",
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      assigneeId: assigneeId !== UNASSIGNED ? assigneeId : null,
      sprintId: sprintId !== NO_SPRINT ? sprintId : null,
    });
    setLoading(false);

    if (result.success) {
      reset();
      queryClient.invalidateQueries({ queryKey: ["board-lists", boardId] });
      queryClient.invalidateQueries({ queryKey: ["sprint-active", boardId] });
      onClose();
      toast.success("Tarefa criada");
    } else {
      toast.error(result.error || "Erro ao criar tarefa");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">Descrição</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais (opcional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 flex flex-col">
              <Label>Vencimento</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date);
                      setIsCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {canAssign && (
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>Sem responsável</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.user.name || m.user.userName || m.user.email || m.userId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {eligibleSprints.length > 0 && (
            <div className="space-y-2">
              <Label>Sprint</Label>
              <Select value={sprintId} onValueChange={setSprintId}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_SPRINT}>Nenhuma sprint</SelectItem>
                  {eligibleSprints.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                      {s.status === "ACTIVE" ? " (ativa)" : " (planejada)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? "Criando..." : "Criar tarefa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}