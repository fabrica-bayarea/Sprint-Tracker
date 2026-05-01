import { getColumns } from "@/features/sprints/history/columns";
import { useTaskStore } from "@/stores/use-task-store";
import { useState, useEffect } from "react";

export function useSprintCard(sprint: any) {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const onMove = useTaskStore((state) => state.onMove);

  useEffect(() => {
    setRowSelection({});
  }, [sprint.items]);

  const columns = getColumns();

  const taskCount = sprint.items.length;
  const selectedCount = Object.keys(rowSelection).length;
  const allSelected = taskCount > 0 && selectedCount === taskCount;
  const someSelected = selectedCount > 0 && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelection: Record<string, boolean> = {};
      sprint.items.forEach((task: any) => {
        newSelection[task.id] = true;
      });
      setRowSelection(newSelection);
    } else {
      setRowSelection({});
    }
  };

  const handleBulkMove = (targetSprintId: string) => {
    const taskIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
    onMove(taskIds, targetSprintId);
  };

  return {
    rowSelection,
    setRowSelection,
    columns,
    selectedCount,
    allSelected,
    someSelected,
    handleSelectAll,
    handleBulkMove,
  };
}