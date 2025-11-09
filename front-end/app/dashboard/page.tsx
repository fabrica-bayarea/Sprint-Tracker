"use client";

import { useEffect, useState } from "react";
import { Check, Trash2, CheckCircle2, MoreVertical } from "lucide-react";

import { getBoards, getBoardMembers, deleteBoardMember, deleteBoard } from "@/lib/actions/board";
import { getExpiredTasks, deleteTask, updateTask } from "@/lib/actions/task";
import { useWarningStore } from '@/lib/stores/warning';
import { useConfirmStore } from '@/lib/stores/confirm';
import { getUserFromCookie } from '@/lib/utils/sessionCookie';

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
  members: number;
  image: string;
}

export default function Dashboard() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [pendencias, setPendencias] = useState<PendenciaItem[]>([]);
  const { showWarning } = useWarningStore()
  const [openMenuBoardId, setOpenMenuBoardId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [boardRoles, setBoardRoles] = useState<Record<string, 'Administrador' | 'Membro' | 'Observador' | null>>({});
  const { showConfirm } = useConfirmStore();

  const handleDeleteTask = async (taskId: string) => {
    try {
      const result = await deleteTask(taskId);
      if (result.success) {
        setPendencias(prevPendencias => 
          prevPendencias.filter(p => p.id !== taskId)
        );
        showWarning("Tarefa deletada com sucesso!", 'success');
      } else {
        showWarning(result.error || "Erro ao deletar tarefa", 'failed');
      }
    } catch {
      showWarning("Erro ao deletar tarefa", 'failed');
    }
  };

  const handleMarkAsDone = async (taskId: string) => {
    try {
      const result = await updateTask(taskId, { status: "DONE" });
      if (result.success) {
        setPendencias(prevPendencias => 
          prevPendencias.filter(p => p.id !== taskId)
        );
        showWarning("Tarefa marcada como concluída!", 'success');
      } else {
        showWarning(result.error || "Erro ao atualizar tarefa", 'failed');
      }
    } catch {
      showWarning("Erro ao atualizar tarefa", 'failed');
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    try {
      const confirmed = await showConfirm({
        message: 'Tem certeza que deseja excluir este board? Essa ação não pode ser desfeita.',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
      });
      if (!confirmed) return;

      const res = await deleteBoard(boardId);
      if (res.success) {
        setBoards((prev) => prev.filter((b) => b.id !== boardId));
        setBoardRoles((prev) => {
          const rest = { ...prev };
          delete rest[boardId];
          return rest;
        });
        showWarning('Board excluído com sucesso', 'success');
      } else {
        showWarning(res.error || 'Falha ao excluir o board', 'failed');
      }
    } catch {
      showWarning('Erro ao excluir o board', 'failed');
    } finally {
      setOpenMenuBoardId(null);
    }
  };

  useEffect(() => {
    async function fetchBoards() {
      const result = await getBoards();
      if (result.success) {
        const boardsData = result.data as Board[];
        setBoards(boardsData);

        try {
          const me = await getUserFromCookie();
          const meId = (me?.sub as string) || null;
          setCurrentUserId(meId);

          if (meId && boardsData.length > 0) {
            const roleEntries = await Promise.all(
              boardsData.map(async (b) => {
                const membersRes = await getBoardMembers(b.id);
                if (membersRes.success) {
                  const myMember = membersRes.data.find((m) => m.id === meId);
                  return [b.id, (myMember?.role as 'Administrador' | 'Membro' | 'Observador' | undefined) ?? null] as const;
                }
                return [b.id, null] as const;
              })
            );
            setBoardRoles(Object.fromEntries(roleEntries));
          }
        } catch (e) {
          console.error('Falha ao carregar papéis dos boards:', e);
        }
      } else {
        showWarning(result.error || "Erro ao buscar boards", 'failed')
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
          showWarning(result.error || "Erro ao buscar tarefas expiradas", 'failed')
        }
      } catch (error) {
        showWarning(error as string || "Erro ao buscar tarefas expiradas", 'failed');
      }
    }

    fetchBoards();
    fetchExpiredTasks();
  }, [showWarning]);

  const handleLeaveBoard = async (boardId: string) => {
    try {
      let meId = currentUserId;
      if (!meId) {
        const me = await getUserFromCookie();
        meId = (me?.sub as string) || null;
      }
      if (!meId) {
        showWarning('Não foi possível identificar o usuário autenticado', 'failed');
        return;
      }

      const res = await deleteBoardMember(boardId, meId);
      if (res.success) {
        setBoards((prev) => prev.filter((b) => b.id !== boardId));
        setBoardRoles((prev) => {
          const rest = { ...prev };
          delete rest[boardId];
          return rest;
        });
        showWarning('Você saiu do board com sucesso', 'success');
      } else {
        showWarning(res.error || 'Falha ao sair do board', 'failed');
      }
    } catch {
      showWarning('Erro ao sair do board', 'failed');
    } finally {
      setOpenMenuBoardId(null);
    }
  };

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickOutside() {
      if (openMenuBoardId) setOpenMenuBoardId(null);
    }
    if (openMenuBoardId) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuBoardId]);

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
                <button
                  className={styles.boardMenuButton}
                  title="Opções"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuBoardId(prev => prev === b.id ? null : b.id);
                  }}
                >
                  <MoreVertical size={18} />
                </button>

                {openMenuBoardId === b.id && (
                  <div
                    className={styles.boardMenu}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {boardRoles[b.id] === 'Administrador' && (
                      <>
                        <button className={styles.boardMenuItem} onClick={() => setOpenMenuBoardId(null)}>
                          Editar
                        </button>
                        <button className={styles.boardMenuItem} onClick={() => handleDeleteBoard(b.id)}>
                          Excluir
                        </button>
                      </>
                    )}
                    <button className={styles.boardMenuItem} onClick={() => handleLeaveBoard(b.id)}>
                      Sair
                    </button>
                  </div>
                )}

                <div className={styles.boardImgCustom}></div>
                <div className={styles.boardInfoCustom}>
                  <span className={styles.boardNameCustom}>{b.name}</span> 
                  <span className={styles.boardMembrosCustom}>{b.members} Membros</span> 
                </div>
              </div>
            ))
          )}
        </div>
      </Section>
    </main>
  );
}