"use client";

import { useState, KeyboardEvent } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { TaskResponse, ColumnType } from "@/types/task";
import { KanbanCard } from "./kanban-card";
import { Trash2, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface KanbanBoardProps {
  tasks: TaskResponse[];
  setTasks: React.Dispatch<React.SetStateAction<TaskResponse[]>>;
  columns: ColumnType[];
  onDeleteColumn: (id: string) => void;
  onRenameColumn: (id: string, newTitle: string) => void;
}

export function KanbanBoard({ tasks, setTasks, columns, onDeleteColumn, onRenameColumn }: KanbanBoardProps) {
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

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

  const startEditing = (id: string, title: string) => {
    setEditingColumn(id);
    setEditValue(title);
  };

  const handleRenameSubmit = (id: string) => {
    if (editValue.trim() && editValue !== columns.find(c => c.id === id)?.title) {
      onRenameColumn(id, editValue.trim());
    }
    setEditingColumn(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === "Enter") handleRenameSubmit(id);
    if (e.key === "Escape") setEditingColumn(null);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="w-full max-w-full pb-4 overflow-x-auto">
        <div className="flex flex-nowrap gap-6 items-start h-full w-max">
          {columns.map((col) => {
            const columnTasks = tasks.filter((t) => t.listId === col.id);
            return (
              <div key={col.id} className="shrink-0 w-[320px] bg-[#dfdfdf] rounded-lg p-4 min-h-37.5">
                <div className="flex items-center justify-between mb-4 group h-8">
                  {editingColumn === col.id ? (
                    <Input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleRenameSubmit(col.id)}
                      onKeyDown={(e) => handleKeyDown(e, col.id)}
                      className="h-8 font-bold text-lg px-2 bg-white"
                    />
                  ) : (
                    <h2 className="font-bold text-lg truncate pr-2">{col.title}</h2>
                  )}

                  <div className={`flex items-center gap-2 ${editingColumn === col.id ? 'hidden' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    <button
                      onClick={() => startEditing(col.id, col.title)}
                      className="text-muted-foreground hover:text-black"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-muted-foreground hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Excluir coluna</DialogTitle>
                          <DialogDescription>
                            Tem certeza que deseja excluir a coluna "{col.title}"? Todas as tarefas contidas nela também poderão ser afetadas.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-4 gap-2">
                          <DialogClose asChild>
                            <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-sm font-medium transition-colors">
                              Cancelar
                            </button>
                          </DialogClose>
                          <button
                            onClick={() => onDeleteColumn(col.id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            Excluir
                          </button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex flex-col gap-4 min-h-37.5 h-full"
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
      </div>
    </DragDropContext>
  );
}