"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus, Trash2 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getBoardMembers,
  inviteBoardMember,
  removeBoardMember,
  changeBoardMemberRole,
} from "@/lib/actions/members";

interface MembersDialogProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  canManage?: boolean;
}

type Role = "ADMIN" | "MEMBER" | "OBSERVER";

const roleLabel: Record<Role, string> = {
  ADMIN: "Administrador",
  MEMBER: "Membro",
  OBSERVER: "Observador",
};

export function MembersDialog({ boardId, isOpen, onClose, canManage = false }: MembersDialogProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("MEMBER");
  const [adding, setAdding] = useState(false);

  const { data } = useQuery({
    queryKey: ["board-members", boardId],
    queryFn: () => getBoardMembers(boardId),
    enabled: isOpen && !!boardId,
  });

  const members = data?.success ? data.data : [];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    const result = await inviteBoardMember(boardId, email.trim(), role);
    setAdding(false);

    if (result.success) {
      setEmail("");
      setRole("MEMBER");
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] });
      toast.success("Membro adicionado");
    } else {
      toast.error(result.error || "Erro ao adicionar membro");
    }
  }

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`Remover "${name}" do board?`)) return;
    const result = await removeBoardMember(boardId, userId);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] });
      toast.success("Membro removido");
    } else {
      toast.error(result.error || "Erro ao remover");
    }
  }

  async function handleChangeRole(userId: string, newRole: Role) {
    const result = await changeBoardMemberRole(boardId, userId, newRole);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] });
      toast.success("Cargo atualizado");
    } else {
      toast.error(result.error || "Erro ao atualizar cargo");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Membros do quadro</DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div className="border border-border rounded-lg divide-y">
            {members.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Nenhum membro ainda.
              </div>
            ) : (
              members.map((m) => {
                const name = m.user.name || m.user.userName || m.user.email || m.userId;
                return (
                  <div key={m.userId} className="flex items-center gap-3 p-3">
                    <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-600 dark:text-red-400 font-semibold flex-shrink-0">
                      {(name[0] || "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{name}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                    </div>
                    {canManage ? (
                      <Select
                        value={m.role}
                        onValueChange={(v) => handleChangeRole(m.userId, v as Role)}
                      >
                        <SelectTrigger className="w-32 sm:w-36 flex-shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Administrador</SelectItem>
                          <SelectItem value="MEMBER">Membro</SelectItem>
                          <SelectItem value="OBSERVER">Observador</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground flex-shrink-0">
                        {roleLabel[m.role]}
                      </span>
                    )}
                    {canManage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(m.userId, name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                        title="Remover membro"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {canManage && (
            <form onSubmit={handleAdd} className="border border-border rounded-lg p-4 space-y-3">
              <div className="text-sm font-medium text-foreground flex items-center gap-2">
                <UserPlus size={16} />
                Adicionar membro por email
              </div>
              <div className="grid grid-cols-[1fr_180px_auto] gap-2">
                <div className="space-y-1">
                  <Label htmlFor="invite-email" className="sr-only">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Membro</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="OBSERVER">Observador</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  disabled={adding}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {adding ? "..." : "Adicionar"}
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
