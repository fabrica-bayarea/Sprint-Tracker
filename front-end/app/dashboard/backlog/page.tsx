"use client";

import { useState, useEffect } from "react";
import { RowSelectionState } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Search, FolderOpen, ArchiveX, Plus, Loader2, LayoutGrid, List } from "lucide-react";
import { DataTable } from "@/features/backlog/components/data-table";
import { getBacklogColumns } from "@/features/backlog/components/columns";
import { KanbanCard } from "@/features/sprints/current/kanban-card";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useTaskStore } from "@/stores/use-task-store";
import { CreateTaskDialog } from "@/features/backlog/components/create-task-dialog";

export default function BacklogPage() {
  const { sprints } = useTaskStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const columns = getBacklogColumns();

  useEffect(() => {
    const allTasks = sprints.flatMap((sprint) => sprint.items);
    setTasks(allTasks);
    setIsLoading(false);
  }, [sprints]);

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full space-y-8 p-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Backlog do Produto</h1>
        <p className="text-[#5C403C] mt-1 text-sm">Gerencie suas tarefas de backlog</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center w-80 bg-[#dfdfdf] rounded-lg">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-md">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-gray-100" : "text-gray-500 hover:text-gray-700"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded transition-colors ${viewMode === "table" ? "bg-gray-100" : "text-gray-500 hover:text-gray-700"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm text-sm hover:cursor-pointer"
        >
          <Plus size={16} />
          Nova Tarefa
        </button>
      </div>

      <div className="space-y-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
            <p className="text-muted-foreground text-sm">Loading tasks...</p>
          </div>
        )}

        {!isLoading && tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 border border-dashed rounded-lg">
            <ArchiveX className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Backlog is empty</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Create your first task to start planning your work.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-6 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm hover:cursor-pointer"
            >
              <Plus size={16} />
              Nova Tarefa
            </button>
          </div>
        )}

        {!isLoading && tasks.length > 0 && filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 border border-dashed rounded-lg">
            <FolderOpen className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No results</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              No tasks found matching &quot;{search}&quot;. Try a different search term.
            </p>
          </div>
        )}

        {!isLoading && filteredTasks.length > 0 && viewMode === "table" && (
          <div className="rounded-lg border bg-card">
            <DataTable
              columns={columns}
              data={filteredTasks}
              rowSelection={rowSelection}
              setRowSelection={setRowSelection}
            />
          </div>
        )}

        {!isLoading && filteredTasks.length > 0 && viewMode === "grid" && (
          <DragDropContext onDragEnd={() => {}}>
            <Droppable droppableId="backlog-grid">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {filteredTasks.map((task, index) => (
                    <KanbanCard key={task.id} task={task} index={index} isDraggable={false} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      <CreateTaskDialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
    </div>
  );
}