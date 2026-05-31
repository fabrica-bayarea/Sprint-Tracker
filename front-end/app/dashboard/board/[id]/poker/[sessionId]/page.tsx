"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBoardById } from "@/lib/actions/board";
import { getPokerSession, votePokerSession, revealPokerSession, nextCardPokerSession, closePokerSession, startPokerSession } from "@/lib/actions/poker";
import { getUserProfile } from "@/lib/actions/profile";
import { validateId } from "@/lib/utils/validateId";
import { usePokerSocket } from "@/features/poker/hooks/use-poker-socket";
import { PokerTable } from "@/features/poker/components/poker-table";
import { CardDeck } from "@/features/poker/components/card-deck";
import { ResultsChart } from "@/features/poker/components/results-chart";
import { toast } from "sonner";

export default function PokerSessionPage() {
  const params = useParams();
  const router = useRouter();

  let boardId: string;
  let sessionId: string;

  try {
    boardId = validateId(params.id, "boardId");
    sessionId = validateId(params.sessionId, "sessionId");
  } catch {
    return (
      <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center py-24 text-center">
        <p className="text-foreground font-medium text-lg">Sessão inválida</p>
        <p className="text-sm text-muted-foreground mt-1">O link desta sessão não é válido.</p>
      </div>
    );
  }

  return <PokerSessionView boardId={boardId} sessionId={sessionId} router={router} />;
}

function PokerSessionView({
  boardId,
  sessionId,
  router,
}: {
  boardId: string;
  sessionId: string;
  router: ReturnType<typeof useRouter>;
}) {
  const [copied, setCopied] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ["me-profile"],
    queryFn: getUserProfile,
    staleTime: 5 * 60 * 1000,
  });
  const currentUserId = profileData?.success ? profileData.data?.id : null;

  const { data: boardData, isLoading: loadingBoard } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => getBoardById(boardId),
    enabled: !!boardId,
  });

  const { data: sessionData, isLoading: loadingSession } = useQuery({
    queryKey: ["poker-session", boardId, sessionId],
    queryFn: () => getPokerSession(boardId, sessionId),
    enabled: !!boardId && !!sessionId,
  });

  const board = boardData?.success ? boardData.data : null;
  const session = sessionData?.success ? sessionData.data : null;

  const isAdmin = board?.ownerId === currentUserId;

  const { connected, users, sessionState } = usePokerSocket(sessionId);

  const currentUserState = currentUserId ? users[currentUserId] : null;
  const currentVote = currentUserState?.voteValue;

  async function copyLink() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const handleVote = async (value: string) => {
    if (sessionState !== "VOTING") return;
    try {
      const res = await votePokerSession(sessionId, value);
      if (res.success) {
        toast.success(`Voto ${value} registrado!`);
      } else {
        toast.error("Erro ao registrar voto");
      }
    } catch (err) {
      toast.error("Erro ao registrar voto");
    }
  };

  const handleReveal = async () => {
    try {
      const res = await revealPokerSession(sessionId);
      if (res.success) toast.success("Cartas reveladas!");
      else toast.error("Erro ao revelar cartas");
    } catch (err) {
      toast.error("Erro ao revelar cartas");
    }
  };

  const handleNextCard = async () => {
    try {
      const res = await nextCardPokerSession(sessionId);
      if (res.success) toast.success("Nova rodada iniciada!");
      else toast.error("Erro ao iniciar nova rodada");
    } catch (err) {
      toast.error("Erro ao iniciar nova rodada");
    }
  };

  const handleCloseSession = async () => {
    try {
      const res = await closePokerSession(sessionId);
      if (res.success) {
        toast.success("Sessão encerrada!");
        router.push(`/dashboard/board/${boardId}/poker`);
      } else {
        toast.error("Erro ao encerrar sessão");
      }
    } catch (err) {
      toast.error("Erro ao encerrar sessão");
    }
  };

  const handleStart = async () => {
    try {
      const res = await startPokerSession(sessionId);
      if (res.success) {
        toast.success("Sessão iniciada!");
      } else {
        toast.error("Erro ao iniciar sessão");
      }
    } catch (err) {
      toast.error("Erro ao iniciar sessão");
    }
  };

  const isLoading = loadingBoard || loadingSession;

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-6 w-24 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const allVotes = Object.values(users).filter(u => u.voteValue).map(u => ({ voteValue: u.voteValue! }));

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
      {/* Esquerda: Mesa Principal */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <button
            onClick={() => router.push(`/dashboard/board/${boardId}/poker`)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar para sessões
          </button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              Poker: {(session as any)?.title || `Sessão ${sessionId.substring(0, 6)}`}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${connected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {connected ? "Conectado" : "Desconectado"}
              </span>
            </h1>
            {(session as any)?.task && (
              <p className="text-sm font-mono text-muted-foreground mt-1">
                #{(session as any).task.id.substring(0, 8)}
                <span className="font-sans font-medium text-foreground ml-2">
                  {(session as any).task.title}
                </span>
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">Estime o esforço requerido. Todos devem votar antes de revelar.</p>
          </div>
        </div>

        <PokerTable
          users={users}
          sessionState={sessionState}
          onReveal={handleReveal}
          onStart={handleStart}
          isAdmin={isAdmin}
        />

        {sessionState === "VOTING" && (
          <div className="mt-8 flex flex-col items-center">
            <p className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-widest">Escolha sua carta</p>
            <CardDeck selected={currentVote} onSelect={handleVote} disabled={currentUserState?.hasVoted} />
          </div>
        )}

        {sessionState === "REVEALED" && isAdmin && (
          <div className="mt-8 flex justify-center gap-4">
            <Button variant="outline" onClick={handleNextCard} className="px-8">Votar Novamente</Button>
            <Button onClick={handleCloseSession} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="mr-2" size={18} />
              Concluir e Salvar
            </Button>
          </div>
        )}
      </div>

      {/* Direita: Sidebar da Sessão */}
      <div className="w-full lg:w-[320px] shrink-0 space-y-6">
        <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Item Atual</h2>
          {(session as any)?.task ? (
            <div className="p-4 bg-muted/40 border border-border rounded-xl">
              <span className="text-xs font-mono text-muted-foreground block mb-1 bg-background px-2 py-1 rounded inline-block">
                #{(session as any).task.id.substring(0, 8)}
              </span>
              <p className="text-sm font-semibold text-foreground mt-2">
                {(session as any).task.title}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhuma task vinculada.</p>
          )}
        </div>

        <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
          {sessionState === "REVEALED" ? (
            <ResultsChart votes={allVotes} />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-center p-4">
              <p className="text-sm text-muted-foreground opacity-50">A distribuição dos votos aparecerá aqui após as cartas serem reveladas.</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-3">Participantes</h2>
          <div className="flex flex-col gap-3 mb-5">
            {Object.values(users).length === 0 ? (
              <p className="text-xs text-muted-foreground">Ninguém na mesa.</p>
            ) : (
              Object.values(users).map(u => (
                <div key={u.userId} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 text-[10px] flex items-center justify-center font-bold">
                    {u.userName ? u.userName.substring(0, 2).toUpperCase() : "?"}
                  </div>
                  <span className="text-xs font-medium text-foreground truncate">{u.userName || "Usuário"}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{u.hasVoted ? "Votou" : "Aguardando"}</span>
                </div>
              ))
            )}
          </div>

          <h2 className="text-sm font-semibold text-foreground mb-3 border-t border-border pt-4">Compartilhar Mesa</h2>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={copyLink}
              className={`w-full ${copied ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : ""}`}
            >
              {copied ? <><Check size={16} className="mr-2" /> Copiado!</> : <><Copy size={16} className="mr-2" /> Copiar Link da Sessão</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
