"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
import { TaskActions } from "./task-actions";
import { priorityConfig } from "@/shared/priority-config";

const getStatusConfig = (status: string) => {
  const s = status?.toUpperCase() || "";
  if (s === "IN_PROGRESS" || s === "IN PROGRESS") return { color: "bg-blue-500", text: "Em Andamento" };
  if (s === "REVIEW") return { color: "bg-orange-500", text: "Em Revisão" };
  if (s === "CRITICAL") return { color: "bg-red-500", text: "Crítico" };
  if (s === "DONE") return { color: "bg-green-500", text: "Concluído" };
  return { color: "bg-gray-300", text: status };
};

export const getColumns = (): ColumnDef<any>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Selecionar tudo"
      />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
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
      const priorityKey = (row.getValue("priority") as string) || "LOW";
      const priority = priorityConfig[priorityKey] || priorityConfig.LOW;

      return (
        <Badge className={`uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-sm ${priority.badgeClass}`}>
          {priority.label}
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
      const { color, text } = getStatusConfig(row.getValue("status") as string);
      return (
        <div className="flex items-center gap-2 text-sm">
          <div className={`h-2 w-2 rounded-full ${color}`} />
          {text}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="text-right">
        <TaskActions task={row.original} />
      </div>
    ),
  },
];