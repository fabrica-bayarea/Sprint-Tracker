"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBoards } from "@/lib/actions/board";
import { CreateBoardDialog } from "../../../features/board/create-board-dialog";
import { useBoardStore } from "@/stores/use-board-store";

export const BoardSelect = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { selectedBoardId, setSelectedBoardId } = useBoardStore();

  const { data } = useQuery({
    queryKey: ["boards"],
    queryFn: getBoards
  });

  return (
    <>
      <Select value={selectedBoardId || ""} onValueChange={setSelectedBoardId}>
        <SelectTrigger className="w-full h-full">
          <SelectValue placeholder="Choose your Board" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {data?.success && data.data?.map((board) => (
              <SelectItem value={board.id} key={board.id}>{board.name}</SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <div
            onClick={() => setIsDialogOpen(true)}
            className="relative flex w-full cursor-pointer items-center gap-1.5 rounded-md py-2 pr-8 pl-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground"
          >
            <Plus size={12} /> Criar Quadro
          </div>
        </SelectContent>
      </Select>

      <CreateBoardDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}