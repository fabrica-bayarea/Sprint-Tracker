"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Copy,
  Check,
  Dices,
  ClipboardList,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getBoardById } from "@/lib/actions/board";
import { getPokerSession } from "@/lib/actions/poker";
import { validateId } from "@/lib/utils/validateId";

export default function PokerSessionPage() {
  const params = useParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  let boardId: string;
  let sessionId: string;

  try {
    boardId = validateId(params.id, "boardId");
    sessionId = validateId(params.sessionId, "sessionId");
  } catch {
    return (
      <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center py-24 text-center">
        <p className="text-foreground font-medium text-lg">Sessão inválida</p>
        <p className="text-sm text-muted-foreground mt-1">
          O link desta sessão não é válido.
        </p>
      </div>
    );
  }

  return (
    <PokerSessionView boardId={boardId} sessionId={sessionId} router={router} copied={copied} setCopied={setCopied} />
  );
}

function PokerSessionView({
  boardId,
  sessionId,
  router,
  copied,
  setCopied,
}: {
  boardId: string;
  sessionId: string;
  router: ReturnType<typeof useRouter>;
  copied: boolean;
  setCopied: (v: boolean) => void;
}) {
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

  async function copyLink() {
    const url = window.location.href;
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

  const isLoading = loadingBoard || loadingSession;

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div className="h-6 w-24 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => router.push(`/dashboard/board/${boardId}`)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar para o board
      </button>

      {/* Header */}
      <div className="rounded-xl bg-card shadow-sm border border-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
              <Dices size={20} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Poker Planning
              </h1>
              {board?.name && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {board.name}
                </p>
              )}
            </div>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded hidden sm:inline-block">
            #{sessionId.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Share link */}
      <div className="rounded-xl bg-card shadow-sm border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Compartilhar sessão
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Qualquer membro do board pode participar desta sessão usando o link
          abaixo.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground font-mono truncate border border-border">
            {typeof window !== "undefined" ? window.location.href : ""}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={copyLink}
            className={
              copied
                ? "gap-2 border-emerald-400 text-emerald-600 dark:text-emerald-400 shrink-0"
                : "gap-2 shrink-0"
            }
          >
            {copied ? (
              <>
                <Check size={15} />
                Copiado!
              </>
            ) : (
              <>
                <Copy size={15} />
                Copiar link
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Task list */}
      <div className="rounded-xl bg-card shadow-sm border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <ClipboardList size={15} />
          Tasks a estimar
          {session && (
            <span className="text-xs font-normal text-muted-foreground">
              ({session.taskIds.length})
            </span>
          )}
        </h2>

        {!session ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar as tasks da sessão. Verifique se o
              backend está ativo.
            </p>
          </div>
        ) : session.taskIds.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4 text-center">
            Nenhuma task nesta sessão.
          </p>
        ) : (
          <ul className="space-y-2">
            {session.taskIds.map((taskId, index) => (
              <li
                key={taskId}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20"
              >
                <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 flex items-center justify-center text-xs font-semibold shrink-0">
                  {index + 1}
                </span>
                <span className="text-xs font-mono text-muted-foreground truncate flex-1">
                  {taskId}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium shrink-0">
                  Aguardando
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
