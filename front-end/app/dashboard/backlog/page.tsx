"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { mockTasks } from "@/lib/types/task"; 
import { BacklogItem } from "@/components/backlog/backlog-item";
import { TaskModal } from "@/components/backlog/task-modal";
import { backlogActions } from "@/lib/actions/backlog";
import { Search, LayoutGrid, List, Plus, ArchiveX, Filter, Loader2 } from "lucide-react"; 

export default function BacklogPage() {
  const router = useRouter();
  
  const [tasks, setTasks] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true); 
  
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortByPriority, setSortByPriority] = useState(false);

  useEffect(() => {
    const selectedBoardId = localStorage.getItem("selectedBoardId");
    if (!selectedBoardId) {
      console.warn("Nenhum board selecionado!");
    }
  }, [router]);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true); 
      const boardId = localStorage.getItem("selectedBoardId") || "123";
      
      // Chamada usando a Action limpa (Axios)
      const data = await backlogActions.getTasks(boardId);
      setTasks(data); 
    } catch (error) {
      console.warn("⚠️ API indisponível. Ativando mockTasks.");
      setTasks(mockTasks); 
    } finally {
      setIsLoading(false); 
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  
  let processedTasks = tasks.filter((task: any) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (sortByPriority) {
    const priorityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    processedTasks.sort((a: any, b: any) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  }

  const isEmpty = tasks.length === 0 && !isLoading;

  return (
    <div className="flex flex-col w-full h-full p-8 bg-gray-50/50 min-h-screen">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Backlog do Produto</h1>
          <p className="text-gray-500">Gerencie as tarefas do backlog</p>
        </div>
        <button 
          onClick={() => {
            setTaskToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm"
        >
          <Plus size={20} />
          Criar Tarefa
        </button>
      </div>

      {isLoading ? (
         <div className="flex flex-col items-center justify-center mt-20 p-12">
            <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium text-lg">Buscando tarefas...</p>
         </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center mt-12 p-12 bg-white rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="w-full h-2 bg-red-600 absolute top-0 left-0" />
          <div className="relative mb-6 mt-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
              <ArchiveX size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Seu Backlog está vazio</h2>
          <button 
            onClick={() => {
              setTaskToEdit(null);
              setIsModalOpen(true);
            }}
            className="mt-6 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
          >
            <Plus size={20} />
            Criar Tarefa
          </button>
        </div>
      ) : (
        <div className="flex flex-col w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex flex-1 items-center gap-3 w-full">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}   
                  placeholder="Pesquisar tarefas..." 
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600/20"
                />
              </div>

              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-md">
                <option value="ALL">Todos os Status</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>

              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-md">
                <option value="ALL">Todas Prioridades</option>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Média</option>
                <option value="LOW">Baixa</option>
              </select>
            </div>
            
            <div className="flex gap-2 bg-white border border-gray-200 p-1 rounded-md shrink-0">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-gray-100' : 'text-gray-500'}`}><LayoutGrid size={18} /></button>
              <button onClick={() => setViewMode('table')} className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-gray-100' : 'text-gray-500'}`}><List size={18} /></button>
            </div>
          </div>
          
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {processedTasks.map((task: any) => (          
                <BacklogItem 
                  key={task.id} task={task} onRefresh={fetchTasks}
                  onEdit={(taskData) => { setTaskToEdit(taskData); setIsModalOpen(true); }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onTaskSaved={fetchTasks} taskToEdit={taskToEdit} />
    </div>
  );
}