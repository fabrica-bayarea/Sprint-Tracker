"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createList } from "@/lib/actions/list";

interface CreateListDialogProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  nextPosition: number;
}

export function CreateListDialog({ boardId, isOpen, onClose, nextPosition }: CreateListDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const result = await createList({ boardId, title: title.trim(), position: nextPosition });
    setLoading(false);

    if (result.success) {
      setTitle("");
      queryClient.invalidateQueries({ queryKey: ["board-lists", boardId] });
      onClose();
      toast.success("Lista criada");
    } else {
      toast.error(result.error || "Erro ao criar lista");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova lista</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="list-title">Título</Label>
            <Input
              id="list-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Backlog, Em progresso, Concluído"
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
              {loading ? "Criando..." : "Criar lista"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
