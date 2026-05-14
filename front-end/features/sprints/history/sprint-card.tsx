"use client";

import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "./data-table";
import { useTaskStore } from "@/stores/use-task-store";
import { useSprintCard } from "@/hooks/sprints/use-sprint-card";

interface SprintCardProps {
  sprint: any;
}

export function SprintCard({ sprint }: SprintCardProps) {
  const sprints = useTaskStore((state) => state.sprints);
  const onAddTask = useTaskStore((state) => state.onAddTask);

  const {
    rowSelection,
    setRowSelection,
    columns,
    selectedCount,
    allSelected,
    someSelected,
    handleSelectAll,
    handleBulkMove,
  } = useSprintCard(sprint);

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-t-lg">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={allSelected || (someSelected ? "indeterminate" : false)}
            onCheckedChange={handleSelectAll}
          />
          <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            {sprint.name} - {sprint.startDate} - {sprint.endDate}
          </span>

          {selectedCount > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="h-7 text-xs ml-2">
                  Mover {selectedCount} selecionados
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {sprints
                  .filter((s) => s.id !== sprint.id)
                  .map((targetSprint) => (
                    <DropdownMenuItem
                      key={targetSprint.id}
                      onClick={() => handleBulkMove(targetSprint.id)}
                    >
                      Para {targetSprint.name}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <Button variant="secondary" size="icon" className="h-8 w-8">
          <Activity className="h-4 w-4" />
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={sprint.items}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        onAddTask={(title) => onAddTask(sprint.id, title)}
      />
    </div>
  );
}