"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tag, Plus, Check } from "lucide-react";

import { Label as UiLabel } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getBoardLabels,
  addLabelToTask,
  removeLabelFromTask,
  type Label,
} from "@/lib/actions/labels";
import type { TaskLabelLink } from "../../types/task";

interface TaskLabelsPickerProps {
  taskId: string;
  boardId: string;
  currentLabels: TaskLabelLink[];
}

export function TaskLabelsPicker({ taskId, boardId, currentLabels }: TaskLabelsPickerProps) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["board-labels", boardId],
    queryFn: () => getBoardLabels(boardId),
    enabled: !!boardId,
  });
  const allLabels: Label[] = data?.success ? data.data : [];

  const assignedIds = new Set(currentLabels.map((l) => l.labelId));

  async function toggle(label: Label) {
    setBusy(true);
    const r = assignedIds.has(label.id)
      ? await removeLabelFromTask(taskId, label.id)
      : await addLabelToTask(taskId, label.id);
    setBusy(false);
    if (r.success) {
      queryClient.invalidateQueries({ queryKey: ["board-lists", boardId] });
    } else {
      toast.error(r.error || "Erro ao atualizar labels");
    }
  }

  return (
    <div className="space-y-2">
      <UiLabel className="flex items-center gap-1.5">
        <Tag size={14} />
        Labels
      </UiLabel>
      <div className="flex flex-wrap gap-1.5 items-center">
        {currentLabels.map((tl) =>
          tl.label ? (
            <span
              key={tl.labelId}
              className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: tl.label.color }}
            >
              {tl.label.name}
            </span>
          ) : null,
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={busy || allLabels.length === 0}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-dashed border-[#CBD5E1] text-[#64748B] hover:border-[#C01010] hover:text-[#C01010] transition-colors disabled:opacity-50"
            >
              <Plus size={12} />
              {currentLabels.length === 0 ? "Adicionar label" : "Editar"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {allLabels.length === 0 ? (
              <div className="p-3 text-xs text-[#94A3B8]">
                Nenhuma label criada ainda no board.
              </div>
            ) : (
              allLabels.map((l) => {
                const assigned = assignedIds.has(l.id);
                return (
                  <DropdownMenuItem
                    key={l.id}
                    onClick={(e) => {
                      e.preventDefault();
                      toggle(l);
                    }}
                    className="gap-2"
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="flex-1 truncate">{l.name}</span>
                    {assigned && <Check size={14} className="text-[#C01010]" />}
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
