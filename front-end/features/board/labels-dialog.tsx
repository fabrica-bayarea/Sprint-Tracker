"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Tag, Pencil, X, Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  getBoardLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  type Label as BoardLabel,
} from "@/lib/actions/labels";

interface LabelsDialogProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  canManage?: boolean;
}

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

export function LabelsDialog({ boardId, isOpen, onClose, canManage = false }: LabelsDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(PRESET_COLORS[0]);

  const { data } = useQuery({
    queryKey: ["board-labels", boardId],
    queryFn: () => getBoardLabels(boardId),
    enabled: isOpen && !!boardId,
  });
  const labels: BoardLabel[] = data?.success ? data.data : [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const r = await createLabel(boardId, { name: name.trim(), color });
    setSaving(false);
    if (r.success) {
      setName("");
      setColor(PRESET_COLORS[0]);
      queryClient.invalidateQueries({ queryKey: ["board-labels", boardId] });
      queryClient.invalidateQueries({ queryKey: ["board-lists", boardId] });
      toast.success("Label criada");
    } else {
      toast.error(r.error || "Erro ao criar label");
    }
  }

  function startEdit(l: BoardLabel) {
    setEditingId(l.id);
    setEditName(l.name);
    setEditColor(l.color);
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return;
    const r = await updateLabel(editingId, { name: editName.trim(), color: editColor });
    if (r.success) {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["board-labels", boardId] });
      queryClient.invalidateQueries({ queryKey: ["board-lists", boardId] });
      toast.success("Label atualizada");
    } else {
      toast.error(r.error || "Erro ao atualizar");
    }
  }

  async function handleDelete(id: string, n: string) {
    if (!confirm(`Excluir a label "${n}"? Ela será removida de todas as tarefas.`)) return;
    const r = await deleteLabel(id);
    if (r.success) {
      queryClient.invalidateQueries({ queryKey: ["board-labels", boardId] });
      queryClient.invalidateQueries({ queryKey: ["board-lists", boardId] });
      toast.success("Label excluída");
    } else {
      toast.error(r.error || "Erro ao excluir");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag size={18} />
            Labels do quadro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div className="border border-border rounded-lg divide-y">
            {labels.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Nenhuma label ainda.
              </div>
            ) : (
              labels.map((l) =>
                editingId === l.id ? (
                  <div key={l.id} className="p-3 space-y-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            editColor === c ? "ring-2 ring-offset-1 ring-red-600 scale-110" : ""
                          }`}
                          style={{ backgroundColor: c }}
                          aria-label={`Cor ${c}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        <X size={14} />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={saveEdit}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Check size={14} className="mr-1" />
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div key={l.id} className="flex items-center gap-2 p-2.5">
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="flex-1 text-sm text-foreground truncate">{l.name}</span>
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => startEdit(l)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(l.id, l.name)}
                          className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                          aria-label="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                ),
              )
            )}
          </div>

          {canManage && (
            <form onSubmit={handleCreate} className="border border-border rounded-lg p-3 space-y-2">
              <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Plus size={14} />
                Nova label
              </div>
              <div className="space-y-1">
                <Label htmlFor="label-name" className="sr-only">Nome</Label>
                <Input
                  id="label-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Bug, Feature, Urgente"
                  maxLength={32}
                  required
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c ? "ring-2 ring-offset-1 ring-red-600 scale-110" : ""
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {saving ? "Criando..." : "Criar label"}
                </Button>
              </div>
            </form>
          )}

          <div className="flex justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
