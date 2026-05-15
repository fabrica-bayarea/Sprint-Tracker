"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical, MoreHorizontal } from "lucide-react";

interface BacklogItemProps {
  task: any;
}

const priorityVariant = (priority: string): "destructive" | "default" | "secondary" => {
  if (priority === "HIGH") return "destructive";
  if (priority === "MEDIUM") return "default";
  return "secondary";
};

export function BacklogItem({ task }: BacklogItemProps) {
  return (
    <Card className="border-t-[3px] border-t-red-600 shadow-sm rounded-md bg-card">
      <CardHeader className="p-6 py-0 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground/40" />
          <Badge
            variant={priorityVariant(task.priority)}
            className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-sm"
          >
            {task.priority}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">
          #{task.id}
        </span>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <h3 className="font-bold text-[18px] mb-2 leading-tight">{task.title}</h3>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          {task.description}
        </p>
        <div className="flex justify-end mt-4">
          <MoreHorizontal className="h-4 w-4 text-muted-foreground/60 cursor-pointer" />
        </div>
      </CardContent>
    </Card>
  );
}