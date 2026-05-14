"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Layout } from "lucide-react";
import { getBoardById } from "@/lib/actions/board";

const BOARD_COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-orange-500",
];

function getBoardColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BOARD_COLORS[Math.abs(hash) % BOARD_COLORS.length];
}

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const boardId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => getBoardById(boardId),
    enabled: !!boardId,
  });

  const board = data?.success ? data.data : null;

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-32 bg-[#F1F5F9] rounded animate-pulse" />
        <div className="rounded-xl bg-white shadow-sm border border-[#E2E8F0] p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-[#F1F5F9] animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-[#F1F5F9] rounded animate-pulse" />
              <div className="h-4 w-72 bg-[#F1F5F9] rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white shadow-sm border border-[#E2E8F0] p-6">
          <div className="h-5 w-32 bg-[#F1F5F9] rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-[#F1F5F9] rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[#1E293B] font-medium text-lg">Quadro não encontrado</p>
        <p className="text-sm text-[#94A3B8] mt-1">
          O quadro que você está procurando não existe ou você não tem acesso.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 px-4 py-2 bg-[#C01010] text-white rounded-lg text-sm font-medium hover:bg-[#a00d0d] transition-colors"
        >
          Voltar para o início
        </button>
      </div>
    );
  }

  const initial = (board.name ?? "?")[0].toUpperCase();
  const colorClass = getBoardColor(board.name ?? "");
  const lists: { id: string; title: string; tasks: unknown[] }[] = board.lists ?? [];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#C01010] transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      {/* Board header card */}
      <div className="rounded-xl bg-white shadow-sm border border-[#E2E8F0] p-6">
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-xl ${colorClass} text-white font-bold text-2xl flex-shrink-0 shadow-sm`}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-[#1E293B] leading-tight">
              {board.name}
            </h1>
            {board.description ? (
              <p className="text-sm text-[#64748B] mt-1">{board.description}</p>
            ) : (
              <p className="text-sm text-[#94A3B8] mt-1 italic">Sem descrição</p>
            )}
          </div>
        </div>
      </div>

      {/* Backlogs / Lists card */}
      <div className="rounded-xl bg-white shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-base font-semibold text-[#1E293B]">Backlogs</h2>
        </div>

        <div className="p-6">
          {lists.length > 0 ? (
            <div className="space-y-3">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className="flex items-center gap-3 p-4 rounded-lg border border-[#E2E8F0] hover:border-[#C01010]/30 hover:bg-[#FEF2F2]/30 transition-all"
                >
                  <div className="w-8 h-8 rounded-md bg-[#FEF2F2] flex items-center justify-center flex-shrink-0">
                    <Layout size={16} className="text-[#C01010]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#1E293B] truncate">{list.title}</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {(list.tasks ?? []).length}{" "}
                      {(list.tasks ?? []).length === 1 ? "tarefa" : "tarefas"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-3">
                <Layout size={20} className="text-[#94A3B8]" />
              </div>
              <p className="text-sm text-[#1E293B] font-medium">Nenhum backlog ainda</p>
              <p className="text-xs text-[#94A3B8] mt-1">
                Os backlogs associados a este quadro aparecerão aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
