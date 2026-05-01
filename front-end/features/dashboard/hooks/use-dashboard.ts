import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBoards } from "@/lib/actions/board";
import { getExpiredTasks, deleteTask, updateTask } from "@/lib/actions/task";
import { useNotificationStore } from '@/stores/notification';
import { Board, ExpiredTask, PendenciaItem } from "@/types/board";

export function useDashboard() {
  const { showNotification } = useNotificationStore();
  const queryClient = useQueryClient();

  const { data, isLoading: loadingBoards } = useQuery({
    queryKey: ["boards"],
    queryFn: getBoards
  });

  const { data: pendencias = [], isLoading: loadingTasks } = useQuery({
    queryKey: ["expiredTasks"],
    queryFn: async () => {
      const result = await getExpiredTasks();
      const tasksData = result.data || result;

      if (!Array.isArray(tasksData)) {
        showNotification("Erro ao buscar tarefas", 'failed');
        return [];
      }

      const currentDate = new Date();
      return tasksData.map((task: ExpiredTask): PendenciaItem => {
        const dueDate = new Date(task.dueDate);
        const isOverdue = dueDate < currentDate;

        return {
          id: task.id,
          titulo: task.title,
          grupo: task.list?.board?.title || "",
          status: isOverdue ? "Atrasado!" : "",
          statusColor: isOverdue ? "#e02b2b" : "#15bd2e",
          andamento: task.list?.title || "",
          data: dueDate.toLocaleDateString('pt-BR'),
          atrasado: isOverdue
        };
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: (result) => {
      if (result.success ?? true) {
        queryClient.invalidateQueries({ queryKey: ["expiredTasks"] });
        showNotification("Tarefa deletada com sucesso!", 'success');
      } else {
        showNotification(result.error || "Erro ao deletar", 'failed');
      }
    },
    onError: () => showNotification("Erro ao deletar tarefa", 'failed')
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => updateTask(id, { status: "DONE" }),
    onSuccess: (result) => {
      if (result.success ?? true) {
        queryClient.invalidateQueries({ queryKey: ["expiredTasks"] });
        showNotification("Tarefa marcada como concluída!", 'success');
      } else {
        showNotification(result.error || "Erro ao atualizar", 'failed');
      }
    },
    onError: () => showNotification("Erro ao atualizar tarefa", 'failed')
  });

  return {
    data,
    pendencias,
    isLoading: loadingBoards || loadingTasks,
    handleDeleteTask: (id: string) => deleteMutation.mutate(id),
    handleMarkAsDone: (id: string) => completeMutation.mutate(id)
  };
}