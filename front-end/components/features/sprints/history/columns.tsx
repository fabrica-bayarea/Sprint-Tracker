"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
import { TaskActions } from "./task-actions";

export const getColumns = (
  sprints: any[],
  onRename: (id: string, title: string) => void,
  onDelete: (id: string) => void,
  onMove: (taskIds: string[], sprintId: string) => void
): ColumnDef<any>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "priority",
    header: "Prioridade",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string;
      return (
        <Badge
          variant={
            priority === "HIGH"
              ? "destructive"
              : priority === "MEDIUM"
              ? "default"
              : "secondary"
          }
          className="text-[10px]"
        >
          {priority}
        </Badge>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Tarefa",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium text-sm">{row.getValue("title")}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.id} • {row.original.description}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="flex items-center gap-2 text-sm">
          <div
            className={`h-2 w-2 rounded-full ${
              status === "In Progress"
                ? "bg-blue-500"
                : status === "Review"
                ? "bg-orange-500"
                : status === "Critical"
                ? "bg-red-500"
                : "bg-gray-300"
            }`}
          />
          {status}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="text-right">
        <TaskActions
          task={row.original}
          sprints={sprints}
          onRename={onRename}
          onDelete={onDelete}
          onMove={onMove}
        />
      </div>
    ),
  },
];