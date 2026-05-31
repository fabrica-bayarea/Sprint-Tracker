"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBoardById } from "@/lib/actions/board";
import { listPokerSessions } from "@/lib/actions/poker";
import { validateId } from "@/lib/utils/validateId";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SessionData {
  id: string;
  title: string;
  pokerStatus: string;
  createdAt: string;
  participantCount: number;
  task?: { id: string; title: string } | null;
}

export default function PokerSessionsList() {
  const params = useParams();
  const router = useRouter();

  let boardId: string;
  try {
    boardId = validateId(params.id, "boardId");
  } catch {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Board Inválido</p>
      </div>
    );
  }

  const { data: boardData, isLoading: loadingBoard } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => getBoardById(boardId),
  });

  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ["poker-sessions", boardId],
    queryFn: async () => {
      const res = await listPokerSessions(boardId);
      if (res.success && res.data) {
        return res.data as SessionData[];
      }
      return [];
    },
  });

  if (loadingBoard || loadingSessions) {
    return (
      <div className="p-10 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded"></div>
        <div className="space-y-4">
          <div className="h-24 bg-muted rounded-xl"></div>
          <div className="h-24 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => router.push(`/dashboard/board/${boardId}`)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-600 transition-colors"
      >
        <ArrowLeft size={16} /> Voltar para o board
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-foreground">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
               <Dices className="text-violet-600 dark:text-violet-400" size={24} />
            </div>
            Sessões de Poker
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Acesse as mesas de planejamento ativas ou o histórico de estimativas deste board.
          </p>
        </div>
      </div>

      <div className="grid gap-4 mt-8">
        {sessions && sessions.length > 0 ? (
          sessions.map((session) => (
            <div key={session.id} className="p-5 bg-card border border-border rounded-xl shadow-sm flex items-center justify-between hover:border-violet-500/50 transition-colors">
              <div>
                <h2 className="font-semibold text-lg text-foreground">{session.title}</h2>
                {session.task && (
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    #{session.task.id.substring(0, 8)} · {session.task.title}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span>{format(new Date(session.createdAt), "dd 'de' MMM, yyyy HH:mm", { locale: ptBR })}</span>
                  <span className="w-1 h-1 rounded-full bg-border"></span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    session.pokerStatus === 'WAITING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                    session.pokerStatus === 'VOTING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' :
                    session.pokerStatus === 'CLOSED' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
                  }`}>
                    {session.pokerStatus}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border"></span>
                  <span className="text-xs font-semibold">
                    <span className={session.participantCount >= 5 ? 'text-red-500' : 'text-violet-600 dark:text-violet-400'}>
                      {session.participantCount}
                    </span>
                    <span className="text-muted-foreground">/5 na mesa</span>
                  </span>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/dashboard/board/${boardId}/poker/${session.id}`)}
                variant="default"
                disabled={session.pokerStatus === 'CLOSED'}
              >
                {session.pokerStatus === 'CLOSED' ? 'Encerrada' : 'Acessar Mesa'}
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center p-16 bg-card border rounded-2xl border-dashed">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
               <Dices className="h-8 w-8 text-muted-foreground/60" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Nenhuma sessão encontrada</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              As sessões de poker são criadas a partir dos cards do Sprint para estimar o esforço da equipe.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
