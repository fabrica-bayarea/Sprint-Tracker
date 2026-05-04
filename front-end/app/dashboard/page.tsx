"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { getBoards } from "@/lib/actions/board";
import { CreateBoardDialog } from "@/features/board/create-board-dialog";

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

export default function Dashboard() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["boards"],
    queryFn: getBoards,
  });

  const boards = data?.success ? data.data : [];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="rounded-xl bg-white shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-base font-semibold text-[#1E293B]">Quadros</h2>
            <p className="text-sm text-[#64748B]">
              Gerenciamento de quadros (criação, listagem, atualização e remoção).
            </p>
          </div>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C01010] text-white rounded-lg text-sm font-medium hover:bg-[#a00d0d] transition-colors"
          >
            <Plus size={16} />
            Novo Quadro
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-lg bg-[#F1F5F9] animate-pulse"
                />
              ))}
            </div>
          ) : boards && boards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {boards.map((board) => {
                const initial = (board.name ?? "?")[0].toUpperCase();
                const colorClass = getBoardColor(board.name ?? "");
                return (
                  <button
                    key={board.id}
                    onClick={() => router.push(`/dashboard/board/${board.id}`)}
                    className="flex items-center gap-3 p-4 rounded-lg border border-[#E2E8F0] hover:border-[#C01010] hover:shadow-md transition-all duration-150 text-left group"
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-lg ${colorClass} text-white font-bold text-lg flex-shrink-0`}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[#1E293B] truncate group-hover:text-[#C01010] transition-colors">
                        {board.name}
                      </p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">Quadro</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-[#FEF2F2] flex items-center justify-center mb-3">
                <Plus size={24} className="text-[#C01010]" />
              </div>
              <p className="text-[#1E293B] font-medium">Nenhum quadro encontrado</p>
              <p className="text-sm text-[#94A3B8] mt-1">
                Crie seu primeiro quadro para começar
              </p>
              <button
                onClick={() => setIsDialogOpen(true)}
                className="mt-4 px-4 py-2 bg-[#C01010] text-white rounded-lg text-sm font-medium hover:bg-[#a00d0d] transition-colors"
              >
                Criar Quadro
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateBoardDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
}
