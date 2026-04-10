import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { backlogActions } from "@/lib/actions/backlog";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskSaved?: () => void; 
  taskToEdit?: any;
}

export function TaskModal({ isOpen, onClose, onTaskSaved, taskToEdit }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || "");
      setDescription(taskToEdit.description || "");
      setStatus(taskToEdit.status || "TODO");
      setPriority(taskToEdit.priority || "MEDIUM");
    } else {
      setTitle("");
      setDescription("");
      setStatus("TODO");
      setPriority("MEDIUM");
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const boardId = localStorage.getItem("selectedBoardId") || "123"; 
      const taskData = { title, description, status, priority };

      // PATCH se estiver editando, POST se for novo, via Axios!
      if (taskToEdit) {
        await backlogActions.updateTask(boardId, taskToEdit.id, taskData);
      } else {
        await backlogActions.createTask(boardId, taskData);
      }

      if (onTaskSaved) onTaskSaved();
      onClose();
    } catch (error) {
      console.error("Falha ao salvar a tarefa", error);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{taskToEdit ? "Editar Tarefa" : "Nova Tarefa"}</h2>
          <button onClick={onClose} disabled={isSaving} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input required disabled={isSaving} value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea rows={3} disabled={isSaving} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} disabled={isSaving} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <select value={priority} disabled={isSaving} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
              {isSaving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : "Salvar Tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}