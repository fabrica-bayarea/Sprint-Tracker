import { BacklogTask } from "@/lib/types/task";
import { MoreHorizontal, GripVertical } from "lucide-react";

interface BacklogTableProps {
  tasks: BacklogTask[];
}

export function BacklogTable({ tasks }: BacklogTableProps) {
  const priorityLabels = {
    HIGH: "ALTA PRIORIDADE",
    MEDIUM: "MÉDIA PRIORIDADE",
    LOW: "BAIXA PRIORIDADE",
  };

  const priorityStyles = {
    HIGH: "text-red-600 bg-red-50",
    MEDIUM: "text-orange-600 bg-orange-50",
    LOW: "text-blue-600 bg-blue-50",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
            <th className="p-4 font-medium w-10"></th>
            <th className="p-4 font-medium">Código</th>
            <th className="p-4 font-medium">Título da Tarefa</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium">Prioridade</th>
            <th className="p-4 font-medium text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50/50 transition-colors group">
              <td className="p-4 text-gray-300">
                <GripVertical size={16} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
              </td>
              <td className="p-4 text-sm font-medium text-gray-400">{task.code}</td>
              <td className="p-4">
                <p className="text-sm font-bold text-gray-900">{task.title}</p>
                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{task.description}</p>
              </td>
              <td className="p-4">
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                  {task.status}
                </span>
              </td>
              <td className="p-4">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${priorityStyles[task.priority]}`}>
                  {priorityLabels[task.priority]}
                </span>
              </td>
              <td className="p-4 text-center">
                <button className="text-gray-400 hover:text-gray-600 p-1">
                  <MoreHorizontal size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}