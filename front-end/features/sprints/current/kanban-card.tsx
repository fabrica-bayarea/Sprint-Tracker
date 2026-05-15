import { Draggable } from "@hello-pangea/dnd";
import { Task } from "@/types/task";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
import { TaskActions } from "../history/task-actions";
import { priorityConfig } from "@/shared/priority-config";

interface KanbanCardProps {
  task: Task;
  index?: number;
  isDraggable?: boolean;
}

export function KanbanCard({ task, index, isDraggable = true }: KanbanCardProps) {
  const priority = priorityConfig[task.priority || "LOW"];

  const cardContent = (
    <Card className={`border-t-[3px] ${priority.borderClass} shadow-sm rounded-md bg-card h-full`}>
      <CardHeader className="p-6 py-0 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2 mt-4">
          {isDraggable && <GripVertical className="h-4 w-4 text-muted-foreground/40" />}
          <Badge 
            variant="secondary" 
            className={`uppercase text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-sm ${priority.badgeClass}`}
          >
            {priority.label}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium mt-4">
          #{task.id}
        </span>
      </CardHeader>
      <CardContent className="p-6 pt-2 flex flex-col justify-between h-full">
        <div>
          <h3 className="font-bold text-[18px] mb-2 leading-tight">{task.title}</h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {task.description}
          </p>
        </div>
        <div className="flex justify-end mt-4">
          <TaskActions task={task} />
        </div>
      </CardContent>
    </Card>
  );

  if (!isDraggable) {
    return cardContent;
  }

  return (
    <Draggable draggableId={task.id} index={index!}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="h-full"
        >
          {cardContent}
        </div>
      )}
    </Draggable>
  );
}