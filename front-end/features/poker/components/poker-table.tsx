"use client";

import { PokerState, PokerUser } from "../hooks/use-poker-socket";
import { Button } from "@/components/ui/button";
import { Eye, Check, Loader2, Play } from "lucide-react";

export function PokerTable({
  users,
  sessionState,
  onReveal,
  onStart,
  isAdmin,
}: {
  users: Record<string, PokerUser>;
  sessionState: PokerState;
  onReveal: () => void;
  onStart: () => void;
  isAdmin: boolean;
}) {
  const usersList = Object.values(users);

  return (
    <div className="relative w-full max-w-3xl mx-auto h-[450px] bg-muted/20 border-2 border-border/50 rounded-[120px] flex items-center justify-center p-8 mt-12 mb-12">
      <div className="flex flex-col items-center justify-center gap-4 text-center z-10">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          {sessionState === "WAITING" && "Aguardando jogadores..."}
          {sessionState === "VOTING" && `Aguardando Votos (${usersList.filter(u => u.hasVoted).length}/${usersList.length})`}
          {sessionState === "REVEALED" && "Cartas Reveladas"}
          {sessionState === "CLOSED" && "Sessão Encerrada"}
        </p>

        {isAdmin && sessionState === "WAITING" && usersList.length >= 2 && (
          <Button onClick={onStart} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-105">
            <Play className="mr-2" size={24} />
            Iniciar Sessão
          </Button>
        )}

        {isAdmin && sessionState === "VOTING" && (
          <Button onClick={onReveal} className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg shadow-red-500/30 transition-all hover:scale-105">
            <Eye className="mr-2" size={24} />
            Revelar Cartas
          </Button>
        )}
      </div>

      {usersList.map((user, index) => {
        const angle = (index / usersList.length) * Math.PI * 2 - Math.PI / 2;
        const radiusX = 300; 
        const radiusY = 200; 
        
        const left = `calc(50% + ${Math.cos(angle) * radiusX}px - 32px)`;
        const top = `calc(50% + ${Math.sin(angle) * radiusY}px - 48px)`;

        return (
          <div
            key={user.userId}
            className="absolute flex flex-col items-center justify-center transition-all duration-500 z-20"
            style={{ left, top }}
          >
            <div className={`w-14 h-20 rounded-xl mb-3 flex items-center justify-center shadow-md transition-all duration-300 ${
              sessionState === "REVEALED" && user.voteValue
                ? "bg-white dark:bg-card border-2 border-red-500 transform scale-110 shadow-red-500/20 shadow-xl"
                : user.hasVoted
                  ? "bg-red-500/20 border-2 border-red-500/50"
                  : "bg-muted border-2 border-dashed border-border"
            }`}>
              {sessionState === "REVEALED" && user.voteValue ? (
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">{user.voteValue}</span>
              ) : user.hasVoted ? (
                <Check className="text-red-500" size={28} />
              ) : (
                <Loader2 className="text-muted-foreground animate-spin opacity-50" size={24} />
              )}
            </div>

            <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-950 flex items-center justify-center shadow-sm border-2 border-background">
               <span className="text-sm font-semibold text-violet-700 dark:text-violet-400">
                 {user.userName ? user.userName.substring(0, 2).toUpperCase() : "?"}
               </span>
            </div>
            <span className="text-xs font-semibold mt-2 px-3 py-1 rounded-full bg-background border border-border shadow-sm truncate max-w-[100px]">
              {user.userName || "Membro"}
            </span>
          </div>
        );
      })}
    </div>
  );
}