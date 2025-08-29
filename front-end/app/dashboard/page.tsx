"use client";

import { useEffect, useState } from "react";
import { Check, Trash2, CheckCircle2 } from "lucide-react";

import { getBoards } from "@/lib/actions/board";
import { getExpiredTasks, deleteTask, updateTask } from "@/lib/actions/task";
import { useNotificationStore } from '@/lib/stores/notification';

import Section from '@/components/features/dashboard/selectedDashboard/section';

import styles from './style.module.css';

interface ExpiredTask {
  id: string;
  listId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: string;
  list: {
    id: string;
    title: string;
    board: {
      id: string;
      title: string;
    };
  };
}

interface PendenciaItem {
  id: string;
  titulo: string;
  grupo: string;
  status: string;
  statusColor: string;
  andamento: string;
  data: string;
  atrasado: boolean;
}


interface Board {
  id: string;
  name: string;
  members: { id: string; name: string; avatar: string }[];
  image: string;
}

export default function Dashboard() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [pendencias, setPendencias] = useState<PendenciaItem[]>([]);
  const { showNotification } = useNotificationStore()

  const handleDeleteTask = async (taskId: string) => {
    try {
      const result = await deleteTask(taskId);
      if (result.success) {
        setPendencias(prevPendencias => 
          prevPendencias.filter(p => p.id !== taskId)
        );
        showNotification("Tarefa deletada com sucesso!", 'success');
      } else {
        showNotification(result.error || "Erro ao deletar tarefa", 'failed');
      }
    } catch {
      showNotification("Erro ao deletar tarefa", 'failed');
    }
  };

  const handleMarkAsDone = async (taskId: string) => {
    try {
      const result = await updateTask(taskId, { status: "DONE" });
      if (result.success) {
        setPendencias(prevPendencias => 
          prevPendencias.filter(p => p.id !== taskId)
        );
        showNotification("Tarefa marcada como concluída!", 'success');
      } else {
        showNotification(result.error || "Erro ao atualizar tarefa", 'failed');
      }
    } catch {
      showNotification("Erro ao atualizar tarefa", 'failed');
    }
  };

  useEffect(() => {
    async function fetchBoards() {
      const result = await getBoards();
      if (result.success) {
        setBoards(result.data as Board[]);
      } else {
        showNotification(result.error || "Erro ao buscar boards", 'failed')
      }
    }

    async function fetchExpiredTasks() {
      try {
        const result = await getExpiredTasks();
        
        if (result.success) {
          if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            const currentDate = new Date();
            const formattedTasks: PendenciaItem[] = result.data.map((task: ExpiredTask) => {
              const dueDate = new Date(task.dueDate);
              const isOverdue = dueDate < currentDate;
              
              return {
                id: task.id,
                titulo: task.title,
                grupo: task.list.board.title,
                status: isOverdue ? "Atrasado!" : "",
                statusColor: isOverdue ? "#e02b2b" : "#15bd2e",
                andamento: task.list.title,
                data: dueDate.toLocaleDateString('pt-BR'),
                atrasado: isOverdue
              };
            });
            setPendencias(formattedTasks);
          } else {
            setPendencias([]);
          }
        } else {
          showNotification(result.error || "Erro ao buscar tarefas expiradas", 'failed')
        }
      } catch (error) {
        showNotification(error as string || "Erro ao buscar tarefas expiradas", 'failed');
      }
    }

    fetchBoards();
    fetchExpiredTasks();
  }, [showNotification]);

  return (
    <main className={styles.dashboardMainCustom}>
      <Section title="Pendências">
        <div className={styles.pendenciasList}>
          {pendencias.length === 0 ? (
            <div className={styles.noPendenciasMessage}>
              <CheckCircle2 size={48} className={styles.noPendenciasIcon} />
              <h3>Parabéns! Você está em dia!</h3>
            </div>
          ) : (
            pendencias.map((p) => (
              <div className={styles.pendenciaRow} key={p.id}>
                <span className={styles.pendenciaTitulo}>{p.titulo}</span>
                <span className={styles.pendenciaAtrasadoWrapper}>
                  {p.atrasado && <span className={styles.pendenciaAtrasado}>Atrasado!</span>}
                </span>
                <span className={styles.pendenciaGrupo}>{p.grupo}/<span>{p.andamento}</span></span>
                <button 
                  className={styles.pendenciaAction}
                  onClick={() => handleDeleteTask(p.id)}
                  title="Deletar tarefa"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  className={styles.pendenciaAction}
                  onClick={() => handleMarkAsDone(p.id)}
                  title="Marcar como concluída"
                >
                  <Check size={18} />
                </button>
                <span className={styles.pendenciaData}>{p.data}</span>
              </div>
            ))
          )}
        </div>
      </Section>
      
      <Section 
        title="Espaços de trabalho"
        actionButton={() => window.location.href = '/dashboard/new-board'}
      >
        <div className={styles.boardsGridCustom}>
          {boards.length === 0 ? (
            <div className={styles.noBoardsMessage}>
              <h3>Você não está em nenhum board</h3>
              <p>Que tal criar o seu primeiro espaço de trabalho?</p>
            </div>
          ) : (
            boards.map((b) => (
              <div
                className={
                  styles.boardCardCustom + ' ' + styles.noImage
                }
                key={b.id}
                onClick={() => window.location.href = `/dashboard/${b.id}`}
              >
                <div className={styles.boardImgCustom}></div>
                <div className={styles.boardInfoCustom}>
                  <span className={styles.boardNameCustom}>{b.name}</span> 
                  <span className={styles.boardMembrosCustom}>1 Membros</span> 
                </div>
              </div>
            ))
          )}
        </div>
      </Section>
    </main>
  );
}