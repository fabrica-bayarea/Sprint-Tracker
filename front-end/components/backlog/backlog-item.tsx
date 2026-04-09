// front-end/components/backlog/backlog-item.tsx

import { BacklogTask } from "@/lib/types/task";
import { MoreHorizontal, MessageSquare, GripVertical } from "lucide-react";


interface BacklogItemProps {
  task: BacklogTask;
}

export function BacklogItem({ task }: BacklogItemProps) {
  const priorityColors = {
    HIGH: "border-t-red-500",
    MEDIUM: "border-t-orange-400",
    LOW: "border-t-blue-400",
  };

  const priorityLabels = {
    HIGH: "ALTA PRIORIDADE",
    MEDIUM: "MÉDIA PRIORIDADE",
    LOW: "BAIXA PRIORIDADE",
  };

  const priorityTextColors = {
    HIGH: "text-red-600",
    MEDIUM: "text-orange-600",
    LOW: "text-blue-600",
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 border-t-4 ${priorityColors[task.priority]} p-5 flex flex-col gap-3 hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <GripVertical className="text-gray-300 cursor-grab" size={16} />
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded bg-gray-50 ${priorityTextColors[task.priority]}`}>
            {priorityLabels[task.priority]}
          </span>
        </div>
        <span className="text-xs text-gray-400 font-medium">{task.code}</span>
      </div>

      <div>
        <h3 className="font-bold text-gray-900 leading-tight mb-1">{task.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      </div>

      <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white" />
            <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          {task.commentsCount && (
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <MessageSquare size={14} />
              <span>{task.commentsCount}</span>
            </div>
          )}
        </div>
        
        <button className="text-gray-400 hover:text-gray-600 p-1">
          <MoreHorizontal size={20} />
        </button>
      </div>
    </div>
  );
}