// front-end/components/backlog/backlog-item.tsx
import { Trash2, Pencil } from "lucide-react";
import { useState } from "react";

interface BacklogItemProps {
  task: any;
  onRefresh?: () => void;
  onEdit?: (task: any) => void;
}

export function BacklogItem({ task, onRefresh, onEdit }: BacklogItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir a tarefa "${task.title}"?`)) {
      return;
    }
    setIsDeleting(true);
    try {
      const boardId = localStorage.getItem("selectedBoardId") || "123";
      const response = await fetch(`http://localhost:8080/api/boards/${boardId}/backlog/${task.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Falha ao deletar.");
      if (onRefresh) onRefresh();
    } catch (error) {
      console.warn("⚠️ API indisponível. O botão faria o DELETE aqui!");
    } finally {
      setIsDeleting(false);
    }
  };

  const priorityColors: Record<string, string> = {
    HIGH: "border-l-4 border-l-red-500",
    MEDIUM: "border-l-4 border-l-yellow-400",
    LOW: "border-l-4 border-l-green-500"
  };

  const taskCode = task.code || `TSK-${String(task.id || Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

  return (
    <div className={`bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full relative group ${priorityColors[task.priority] || ''} ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
      
      {/* Botões de Ação (Hover) */}
      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded-md backdrop-blur-sm">
        <button 
          onClick={() => onEdit && onEdit(task)} 
          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
          title="Editar"
        >
          <Pencil size={14} />
        </button>
        <button 
          onClick={handleDelete} 
          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
          title="Excluir"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-baseline justify-between gap-4 mb-2 pr-10">
        <h3 className="text-lg font-bold text-gray-950 truncate flex-1">{task.title}</h3>
        <span className="text-xs font-mono font-medium text-gray-400 shrink-0">
          {taskCode}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-5 line-clamp-3 flex-grow">
        {task.description || "Nenhuma descrição fornecida."}
      </p>
      
      <div className="flex justify-end gap-2 mt-auto pt-3 border-t border-gray-50">
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-gray-100 text-gray-600 capitalize">
          {task.status ? task.status.toLowerCase().replace("_", " ") : "todo"}
        </span>
        <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-gray-100 text-gray-700 capitalize">
          {task.priority ? task.priority.toLowerCase() : 'medium'}
        </span>
      </div>
    </div>
  );
}