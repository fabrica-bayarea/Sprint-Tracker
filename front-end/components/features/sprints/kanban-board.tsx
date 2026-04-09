"use client";

import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { TaskResponse, ColumnType } from "@/types/task";
import { KanbanCard } from "./kanban-card";

const columns: ColumnType[] = [
  { id: "open", title: "Aberto" },
  { id: "in-progress", title: "Em Progresso" },
  { id: "done", title: "Feito" },
];

interface KanbanBoardProps {
  tasks: TaskResponse[];
  setTasks: React.Dispatch<React.SetStateAction<TaskResponse[]>>;
}

export function KanbanBoard({ tasks, setTasks }: KanbanBoardProps) {
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId !== destination.droppableId) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === result.draggableId
            ? { ...task, listId: destination.droppableId, status: destination.droppableId }
            : task
        )
      );
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 items-start h-full">
        {columns.map((col) => {
          const columnTasks = tasks.filter((t) => t.listId === col.id);
          return (
            <div key={col.id} className="flex-1 bg-[#dfdfdf] rounded-lg p-4 min-h-150">
              <h2 className="font-bold text-lg mb-4">{col.title}</h2>
              <Droppable droppableId={col.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-col gap-4 min-h-37.5"
                  >
                    {columnTasks.map((task, index) => (
                      <KanbanCard key={task.id} task={task} index={index} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}