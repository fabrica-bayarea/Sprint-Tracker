"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

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

interface EditTaskDialogProps {
  task: Task | null;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  members?: BoardMember[];
  canAssign?: boolean;
  canDelete?: boolean;
  /** Admin/owner consegue ver histórico (TaskLogs) */
  canViewHistory?: boolean;
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
}: EditTaskDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>(UNASSIGNED);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setDueDate(task.dueDate ? task.dueDate.slice(0, 16) : "");
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
      // datetime-local → ISO-8601 (Prisma exige)
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
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
      <DialogContent className="max-w-lg">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">A fazer</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em progresso</SelectItem>
                  <SelectItem value="DONE">Concluído</SelectItem>
                  <SelectItem value="ARCHIVED">Arquivada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-task-due">Vencimento</Label>
              <Input
                id="edit-task-due"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
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

          <TaskHistory taskId={task.id} enabled={canViewHistory} />

          <div className="flex justify-between gap-2 pt-2">
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} className="mr-1" />
                {deleting ? "Excluindo..." : "Excluir"}
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
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
