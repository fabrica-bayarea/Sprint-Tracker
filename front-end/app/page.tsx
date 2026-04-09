"use client";

import { useState } from "react";
import { mockTasks } from "@/lib/types/task";
import { BacklogItem } from "@/components/backlog/backlog-item";
import { Search, LayoutGrid, List, Plus, ArchiveX } from "lucide-react"; 

export default function BacklogPage() {
  const [isEmpty, setIsEmpty] = useState(false); 
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  return (
    <div className="flex flex-col w-full h-full p-8 bg-gray-50/50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Backlog do Produto</h1>
          <p className="text-gray-500">Gerencie as tarefas do backlog</p>
        </div>
        <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
          <Plus size={20} />
          Criar Tarefa
        </button>
      </div>

      {isEmpty ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center mt-12 p-12 bg-white rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="w-full h-2 bg-red-600 absolute top-0 left-0" />
          <div className="relative mb-6 mt-4">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
              <ArchiveX size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Seu Backlog está vazio</h2>
          <p className="text-gray-500 mb-6 text-center max-w-sm">
            Comece a organizar seu projeto adicionando sua primeira tarefa!
          </p>
          <button className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium transition-colors shadow-lg shadow-red-600/20">
            <Plus size={20} />
            Criar Tarefa
          </button>
        </div>
      ) : (
        /* Área de Conteúdo (Grid/Table) */
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search backlog..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600/20"
              />
            </div>
            <div className="flex gap-2 bg-white border border-gray-200 p-1 rounded-md">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
          
          {/* Grid de Cards */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {mockTasks.map((task) => (
                <BacklogItem key={task.id} task={task} />
              ))}
            </div>
          )}

          {/* Placeholder da Tabela */}
          {viewMode === 'table' && (
             <div className="bg-white p-8 text-center text-gray-500 border border-gray-200 rounded-lg">
               Visão de tabela em construção...
             </div>
          )}
        </div>
      )}
    </div>
  );
}