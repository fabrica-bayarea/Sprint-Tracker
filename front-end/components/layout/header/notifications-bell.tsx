"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, X } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  getNotifications,
  respondInvite,
  type InviteNotification,
} from "@/lib/actions/notifications";

const roleLabel: Record<InviteNotification["role"], string> = {
  ADMIN: "Administrador",
  MEMBER: "Membro",
  OBSERVER: "Observador",
};

function formatDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

export function NotificationsBell() {
  const queryClient = useQueryClient();
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30_000,
  });

  const all: InviteNotification[] = data?.success ? data.data : [];
  const pending = all.filter((n) => n.statusInvite === "PENDING");
  const count = pending.length;

  async function handleRespond(invite: InviteNotification, accept: boolean) {
    setRespondingId(invite.id);
    const r = await respondInvite(invite.board.id, invite.id, accept);
    setRespondingId(null);
    if (r.success) {
      toast.success(accept ? "Convite aceito" : "Convite recusado");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      if (accept) {
        queryClient.invalidateQueries({ queryKey: ["boards"] });
      }
    } else {
      toast.error(r.error || "Erro ao responder convite");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex items-center justify-center hover:opacity-80 transition-opacity"
          aria-label={`Notificações${count > 0 ? ` (${count} pendentes)` : ""}`}
        >
          <Bell size={28} color="#949494" strokeWidth={2} />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b border-border">
          <p className="font-semibold text-sm text-foreground">Notificações</p>
          <p className="text-xs text-muted-foreground">
            {count === 0
              ? "Sem convites pendentes"
              : `${count} convite${count === 1 ? "" : "s"} aguardando resposta`}
          </p>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {pending.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Você está em dia! ✨
            </div>
          ) : (
            pending.map((n) => (
              <div
                key={n.id}
                className="p-4 border-b border-border last:border-0"
              >
                <p className="text-sm text-foreground">
                  <strong>{n.sender.name || n.sender.userName}</strong> te
                  convidou para o quadro{" "}
                  <strong>{n.board.title}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  como <em>{roleLabel[n.role]}</em> · {formatDate(n.createdAt)}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleRespond(n, true)}
                    disabled={respondingId === n.id}
                    className="bg-red-600 hover:bg-red-700 text-white h-8 px-3 gap-1"
                  >
                    <Check size={14} />
                    Aceitar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespond(n, false)}
                    disabled={respondingId === n.id}
                    className="h-8 px-3 gap-1"
                  >
                    <X size={14} />
                    Recusar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
