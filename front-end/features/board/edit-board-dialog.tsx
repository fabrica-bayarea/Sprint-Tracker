"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBoard, deleteBoard } from "@/lib/actions/board";

interface EditBoardDialogProps {
  boardId: string;
  currentTitle: string;
  currentDescription?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EditBoardDialog({
  boardId,
  currentTitle,
  currentDescription,
  isOpen,
  onClose,
}: EditBoardDialogProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTitle(currentTitle);
    setDescription(currentDescription ?? "");
  }, [currentTitle, currentDescription, boardId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const r = await updateBoard(boardId, {
      title: title.trim(),
      description: description.trim() || undefined,
    });
    setSaving(false);
    if (r.success) {
      toast.success("Quadro atualizado");
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      onClose();
    } else {
      toast.error(r.error || "Erro ao atualizar quadro");
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Excluir o quadro "${currentTitle}" e tudo associado a ele (listas, tarefas, convites)? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    const r = await deleteBoard(boardId);
    setDeleting(false);
    if (r.success) {
      toast.success("Quadro excluído");
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      onClose();
      router.push("/dashboard");
    } else {
      toast.error(r.error || "Erro ao excluir quadro");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar quadro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-board-title">Título</Label>
            <Input
              id="edit-board-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-board-desc">Descrição</Label>
            <Textarea
              id="edit-board-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={16} className="mr-1" />
              {deleting ? "Excluindo..." : "Excluir quadro"}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
