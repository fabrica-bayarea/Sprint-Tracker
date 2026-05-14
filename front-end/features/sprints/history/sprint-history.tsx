"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, History, FolderOpen } from "lucide-react";
import { SprintCard } from "./sprint-card";
import { mockSprints as initialMockSprints } from "@/lib/mocks/tasks";
import { useTaskStore } from "@/stores/use-task-store";
import { Task } from "@/types/task";

export function SprintHistory() {
  const [search, setSearch] = useState("");
  const sprints = useTaskStore((state) => state.sprints);

  const filteredSprints = sprints
    .map((sprint) => ({
      ...sprint,
      items: sprint.items.filter((task: Task) =>
        task.title.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((sprint) => sprint.items.length > 0);

  return (
    <div className="w-full space-y-8">
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
          className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600/20"
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
          />
        ))}
      </div>
    </div>
  );
}