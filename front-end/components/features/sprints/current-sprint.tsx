"use client";

import { useState, useMemo } from "react";
import { initialTasks } from "@/lib/mocks/tasks";
import { TaskResponse } from "@/types/task";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { KanbanBoard } from "./kanban-board";

export function CurrentSprint() {
  const [tasks, setTasks] = useState<TaskResponse[]>(initialTasks);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("none");

  const filteredTasks = useMemo(() => {
    let result = tasks.filter(t => 
      t.title.toLowerCase().includes(search.toLowerCase()) || 
      t.description?.toLowerCase().includes(search.toLowerCase())
    );
    
    if (sort === "asc") result.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "desc") result.sort((a, b) => b.title.localeCompare(a.title));
    if (sort === "date") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return result;
  }, [tasks, search, sort]);

  return (
    <div className="flex flex-col gap-6 px-10 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sprint Atual</h1>
          <p className="text-muted-foreground mt-1 text-sm">Tracking Sprint 24 — Q3 Release Cycle</p>
        </div>
        <Select defaultValue="sprint-24">
          <SelectTrigger className="bg-[#C01010] text-white border-0 focus:ring-0 rounded-md font-medium px-8 py-6" chevronClassName="text-white">
            <SelectValue placeholder="Select Sprint" />
          </SelectTrigger>
          <SelectContent className="bg-[#C01010] text-white">
            <SelectItem value="sprint-24" className="hover:bg-[#8d0b0b_!important] px-8 py-4">Sprint 24</SelectItem>
            <SelectItem value="sprint-23" className="hover:bg-[#8d0b0b_!important] px-8 py-4">Sprint 23</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex items-center w-80 bg-[#dfdfdf] rounded-lg">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search backlog..." 
            className="border-0 px-10 py-3" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Agrupar por</span>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-35 bg-[#DBDBDB] border-0">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nada</SelectItem>
              <SelectItem value="asc">A-Z</SelectItem>
              <SelectItem value="desc">Z-A</SelectItem>
              <SelectItem value="date">Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <KanbanBoard tasks={filteredTasks} setTasks={setTasks} />
    </div>
  );
}