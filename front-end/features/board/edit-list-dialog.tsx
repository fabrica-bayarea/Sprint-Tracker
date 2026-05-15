"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { editList } from "@/lib/actions/list";

interface EditListDialogProps {
  boardId: string;
  listId: string | null;
  currentTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EditListDialog({
  boardId,
  listId,
  currentTitle,
  isOpen,
  onClose,
}: EditListDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(currentTitle);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle(currentTitle);
  }, [currentTitle, listId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listId || !title.trim()) return;
    setLoading(true);
    const result = await editList({ id: listId, title: title.trim() });
    setLoading(false);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["board-lists", boardId] });
      onClose();
      toast.success("Lista renomeada");
    } else {
      toast.error(result.error || "Erro ao renomear lista");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Renomear lista</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="edit-list-title">Novo título</Label>
            <Input
              id="edit-list-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-2">
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
