"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarIcon, Trash2, Dices } from "lucide-react";

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
import { updateTask, deleteTask } from "@/lib/actions/task";
import type { Task } from "../../types/task";
import type { BoardMember } from "@/lib/actions/members";
import { TaskHistory } from "@/features/board/task-history";
import { TaskLabelsPicker } from "@/features/board/task-labels-picker";
import { TaskComments } from "@/features/board/task-comments";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EditTaskDialogProps {
  task: Task | null;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  members?: BoardMember[];
  canAssign?: boolean;
  canDelete?: boolean;
  canViewHistory?: boolean;
  canPoker?: boolean;
  onStartPoker?: () => void;
  currentUserId?: string;
}

const UNASSIGNED = "__unassigned__";

export function EditTaskDialog({
  task,
  boardId,
  isOpen,
  onClose,
  members = [],
  canAssign = false,
  canDelete = false,
  canViewHistory = false,
  canPoker = false,
  onStartPoker,
  currentUserId,
}: EditTaskDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState<string>(UNASSIGNED);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    setAssigneeId(task.assigneeId ?? UNASSIGNED);
  }, [task]);

  if (!task) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!task) return;
    if (!title.trim()) return;
    setLoading(true);
    const result = await updateTask(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      assigneeId: canAssign ? (assigneeId !== UNASSIGNED ? assigneeId : null) : undefined,
    });
    setLoading(false);

    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["board-lists", boardId] });
      onClose();
      toast.success("Tarefa atualizada");
    } else {
      toast.error(result.error || "Erro ao atualizar");
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm(`Excluir a tarefa "${task.title}"?`)) return;
    setDeleting(true);
    const result = await deleteTask(task.id);
    setDeleting(false);

    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["board-lists", boardId] });
      onClose();
      toast.success("Tarefa excluída");
    } else {
      toast.error(result.error || "Erro ao excluir");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Editar tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-task-title">Título</Label>
            <Input
              id="edit-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-task-desc">Descrição</Label>
            <Textarea
              id="edit-task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">A fazer</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em progresso</SelectItem>
                  <SelectItem value="BLOCKED">Impedido</SelectItem>
                  <SelectItem value="DONE">Concluído</SelectItem>
                  <SelectItem value="ARCHIVED">Arquivada</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                    {dueDate ? format(dueDate, "PPP") : <span>Selecione uma data</span>}
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

          <TaskLabelsPicker
            taskId={task.id}
            boardId={boardId}
            currentLabels={task.labels ?? []}
          />

          <TaskComments taskId={task.id} currentUserId={currentUserId} />

          <TaskHistory taskId={task.id} enabled={canViewHistory} />

          {canPoker && (
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onStartPoker}
                className="w-full gap-2 border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-400 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/20"
              >
                <Dices size={15} />
                Estimar com Poker Planning
              </Button>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-2">
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 sm:w-auto w-full"
              >
                <Trash2 size={16} className="mr-1" />
                {deleting ? "Excluindo..." : "Excluir"}
              </Button>
            ) : (
              <div />
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:w-auto w-full">
              <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
              >
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
