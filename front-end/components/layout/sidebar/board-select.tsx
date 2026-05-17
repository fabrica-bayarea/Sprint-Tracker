"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBoards } from "@/lib/actions/board";
import { CreateBoardDialog } from "../../../features/board/create-board-dialog";
import { useBoardStore } from "@/stores/use-board-store";

export const BoardSelect = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { selectedBoardId, setSelectedBoardId } = useBoardStore();

  const { data, isSuccess } = useQuery({
    queryKey: ["boards"],
    queryFn: getBoards
  });

  const boards = (data?.success && data.data) ? data.data : [];

  /**
   * Auto-correção do `selectedBoardId` quando ele aponta pra um board
   * que não existe mais (banco trocado, board removido, etc.).
   *
   * O zustand `useBoardStore` persiste `selectedBoardId` no localStorage
   * pra "lembrar" o último board entre sessões. Mas se o usuário trocar
   * de banco (ex: postgres do host → postgres do compose) ou se o board
   * for excluído por outro usuário, o ID persistido vira lixo — e o
   * front passa a chamar `/v1/boards/<UUID_VELHO>/...`, recebendo 404
   * "Board não encontrado" em silêncio.
   *
   * Quando a lista carrega:
   *  - Se o ID atual está na lista, mantém.
   *  - Se não está e existem boards, seleciona o primeiro.
   *  - Se não existem boards, limpa.
   */
  useEffect(() => {
    if (!isSuccess) return;
    const ids = boards.map((b) => b.id);
    if (selectedBoardId && ids.includes(selectedBoardId)) return;
    if (boards.length > 0) {
      setSelectedBoardId(boards[0].id);
    } else if (selectedBoardId) {
      // Sem boards e ainda tinha um ID stale persistido → limpa.
      setSelectedBoardId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, boards.length]);

  /**
   * Atualiza o store e navega quando a rota depende do boardId na URL.
   * Sem isso, o store muda mas /dashboard/board/[id] continua mostrando
   * o board antigo (id vem de params).
   */
  function handleChange(id: string) {
    setSelectedBoardId(id);
    if (pathname.startsWith("/dashboard/board/")) {
      router.push(`/dashboard/board/${id}`);
    }
  }

  return (
    <>
      <Select value={selectedBoardId || ""} onValueChange={handleChange}>
        <SelectTrigger className="w-full h-full">
          <SelectValue placeholder="Choose your Board" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {boards.map((board) => (
              <SelectItem value={board.id} key={board.id}>{board.name}</SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="relative flex w-full cursor-pointer items-center gap-1.5 rounded-md py-2 pr-8 pl-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground bg-transparent border-0 text-left"
          >
            <Plus size={12} /> Criar Quadro
          </button>
        </SelectContent>
      </Select>

      <CreateBoardDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
