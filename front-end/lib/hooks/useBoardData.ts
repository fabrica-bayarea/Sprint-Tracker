import { useEffect } from 'react';

import { getAllList, getListById } from '@/lib/actions/list';
import { useBoardStore } from '@/lib/stores/board';
import { useWarningStore } from '@/lib/stores/warning';
import { useBoardWebSocket } from '@/lib/hooks/useBoardWebSocket';

import { List, listResponseToList } from '@/lib/types/board'

/**
 * Hook para carregar e gerenciar os dados iniciais de um board
 * Busca todas as listas e suas respectivas tarefas e configura a conexão WebSocket
 */
export function useBoardData(boardId: string) {
  const { setLists, setLoading } = useBoardStore();
  const { showWarning } = useWarningStore();
  
  useBoardWebSocket(boardId);

  useEffect(() => {
    if (!boardId) return;

    const fetchBoardData = async () => {
      setLoading(true);
      
      try {
        const result = await getAllList(boardId);
        if (result.success) {
          const listsWithTasks = await Promise.all(
            (result.data || []).map(async (list: List) => {
              const tasksResult = await getListById(list.id);
              if (tasksResult.success && tasksResult.data) {
                return listResponseToList(tasksResult.data);
              }
              return {
                ...list,
                tasks: []
              };
            })
          );
          setLists(listsWithTasks);
        } else {
          showWarning("Erro ao buscar dados do quadro: " + result.error, "failed");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBoardData();
  }, [boardId, setLists, setLoading, showWarning]);
}
