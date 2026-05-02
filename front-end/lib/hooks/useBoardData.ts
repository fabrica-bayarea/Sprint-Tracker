import { useEffect } from 'react';

import { getAllList, getListById } from '@/lib/actions/list';
import { getUserBoardRole, getBoardById, getBoardMembers } from '@/lib/actions/board';
import { useBoardStore } from '@/lib/stores/board';
import { useWarningStore } from '@/lib/stores/warning';
import { useBoardWebSocket } from '@/lib/hooks/useBoardWebSocket';

import { List, listResponseToList } from '@/lib/types/board';

/**
 * Hook para carregar e gerenciar os dados iniciais de um board
 * Busca todas as listas e suas respectivas tarefas, papel do usuário, membros e configura WebSocket.
 */
export function useBoardData(boardId: string) {
  const {
    setLists,
    setLoading,
    setIsCurrentUserAdmin,
    setBoardTitle,
    setMembers,
  } = useBoardStore();
  const { showWarning } = useWarningStore();

  useBoardWebSocket(boardId);

  useEffect(() => {
    if (!boardId) return;

    const fetchBoardData = async () => {
      setLoading(true);

      try {
        const [listsResult, roleResult, boardResult, membersResult] =
          await Promise.all([
            getAllList(boardId),
            getUserBoardRole(boardId),
            getBoardById(boardId),
            getBoardMembers(boardId),
          ]);

        if (roleResult.success && roleResult.data) {
          const role = roleResult.data;
          setIsCurrentUserAdmin(role === 'OWNER' || role === 'ADMIN');
        }

        if (boardResult.success && boardResult.data) {
          setBoardTitle(boardResult.data.name);
        }

        if (membersResult.success && membersResult.data) {
          setMembers(membersResult.data);
        }

        if (listsResult.success) {
          const listsWithTasks = await Promise.all(
            (listsResult.data || []).map(async (list: List) => {
              const tasksResult = await getListById(list.id);
              if (tasksResult.success && tasksResult.data) {
                return listResponseToList(tasksResult.data);
              }
              return {
                ...list,
                tasks: [],
              };
            }),
          );
          setLists(listsWithTasks);
        } else {
          showWarning(
            'Erro ao buscar dados do quadro: ' + listsResult.error,
            'failed',
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBoardData();
  }, [
    boardId,
    setLists,
    setLoading,
    setIsCurrentUserAdmin,
    setBoardTitle,
    setMembers,
    showWarning,
  ]);
}
