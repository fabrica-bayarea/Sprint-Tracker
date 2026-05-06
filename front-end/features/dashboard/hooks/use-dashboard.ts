import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBoards } from "@/lib/actions/board";
import { getExpiredTasks, deleteTask, updateTask } from "@/lib/actions/task";
import { Board, ExpiredTask, PendenciaItem } from "@/types/board";
import { toast } from "sonner";

export function useDashboard() {
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
        toast.error("Erro ao buscar tarefas");
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
        toast.success("Tarefa deletada com sucesso!");
      } else {
        toast.error(result.error || "Erro ao deletar");
      }
    },
    onError: () => toast.error("Erro ao deletar tarefa")
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => updateTask(id, { status: "DONE" }),
    onSuccess: (result) => {
      if (result.success ?? true) {
        queryClient.invalidateQueries({ queryKey: ["expiredTasks"] });
        toast.success("Tarefa marcada como concluída!");
      } else {
        toast.error(result.error || "Erro ao atualizar");
      }
    },
    onError: () => toast.error("Erro ao atualizar tarefa")
  });

  return {
    data,
    pendencias,
    isLoading: loadingBoards || loadingTasks,
    handleDeleteTask: (id: string) => deleteMutation.mutate(id),
    handleMarkAsDone: (id: string) => completeMutation.mutate(id)
  };
}