"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, History, FolderOpen } from "lucide-react";
import { SprintCard } from "./sprint-card";
import { mockSprints as initialMockSprints } from "@/lib/mocks/tasks";

export function SprintHistory() {
  const [search, setSearch] = useState("");
  const [sprints, setSprints] = useState(() => 
    initialMockSprints.map(s => ({
      ...s,
      items: s.items.map(t => ({ ...t, id: `${s.id}-${t.id}`, sprintId: s.id }))
    }))
  );

  const handleRename = (taskId: string, newTitle: string) => {
    setSprints((prev) =>
      prev.map((sprint) => ({
        ...sprint,
        items: sprint.items.map((task) =>
          task.id === taskId ? { ...task, title: newTitle } : task
        ),
      }))
    );
  };

  const handleDelete = (taskId: string) => {
    setSprints((prev) =>
      prev.map((sprint) => ({
        ...sprint,
        items: sprint.items.filter((task) => task.id !== taskId),
      }))
    );
  };

  const handleMove = (taskIds: string[], targetSprintId: string) => {
    setSprints((prev) => {
      const tasksToMove: any[] = [];
      
      const withoutTasks = prev.map((sprint) => {
        const matchingTasks = sprint.items.filter((t) => taskIds.includes(t.id));
        if (matchingTasks.length > 0) {
          tasksToMove.push(...matchingTasks.map(t => ({ ...t, sprintId: targetSprintId })));
        }
        return {
          ...sprint,
          items: sprint.items.filter((t) => !taskIds.includes(t.id)),
        };
      });

      if (tasksToMove.length === 0) return prev;

      return withoutTasks.map((sprint) =>
        sprint.id === targetSprintId
          ? { ...sprint, items: [...sprint.items, ...tasksToMove] }
          : sprint
      );
    });
  };

  const handleAddTask = (sprintId: string, title: string) => {
    const newTask = {
      id: `NEW-${Math.floor(Math.random() * 10000)}`,
      listId: "list-1",
      sprintId: sprintId,
      title: title,
      position: 999,
      status: "Backlog",
      priority: "LOW" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSprints((prev) =>
      prev.map((sprint) =>
        sprint.id === sprintId
          ? { ...sprint, items: [...sprint.items, newTask] }
          : sprint
      )
    );
  };

  const filteredSprints = sprints
    .map((sprint) => ({
      ...sprint,
      items: sprint.items.filter((task) =>
        task.title.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((sprint) => sprint.items.length > 0);

  return (
    <div className="w-full space-y-8 px-10 py-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Histórico de Sprints
        </h1>
        <p className="text-[#5C403C] mt-1 text-sm">Veja todas as sprints já feitas</p>
      </div>

      <div className="relative flex items-center w-80 bg-[#dfdfdf] rounded-lg">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Procurar tarefa..."
          className="border-0 px-10 py-3 bg-transparent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        {sprints.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 border border-dashed rounded-lg">
            <History className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma sprint encontrada</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              O histórico está vazio. Comece a planejar e concluir sprints para vê-las aqui.
            </p>
          </div>
        )}

        {sprints.length > 0 && filteredSprints.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 border border-dashed rounded-lg">
            <FolderOpen className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum resultado</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Não encontramos nenhuma tarefa correspondente a "{search}". Tente buscar por outro termo.
            </p>
          </div>
        )}

        {filteredSprints.map((sprint) => (
          <SprintCard
            key={sprint.id}
            sprint={sprint}
            allSprints={sprints}
            onRename={handleRename}
            onDelete={handleDelete}
            onMove={handleMove}
            onAddTask={handleAddTask}
          />
        ))}
      </div>
    </div>
  );
}