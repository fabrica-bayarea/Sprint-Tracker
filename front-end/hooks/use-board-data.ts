import { useEffect } from 'react';

import { getAllList } from '@/lib/actions/list';
import { getTasksByList } from '@/lib/actions/task';
import { useBoardStore } from '@/stores/board';
import { useNotificationStore } from '@/stores/notification';

import { Status } from '@/types/board'
import { List } from '@/types/list';

export function useBoardData(boardId: string) {
  const { setLists, setLoading } = useBoardStore();
  const { showNotification } = useNotificationStore();

  useEffect(() => {
    if (!boardId) return;

    const fetchBoardData = async () => {
      setLoading(true);
      
      try {
        const result = await getAllList(boardId);
        if (result.success) {
          const listsWithTasks = await Promise.all(
            (result.data || []).map(async (list: List) => {
              const tasksResult = await getTasksByList(list.id);
              return {
                ...list,
                tasks: tasksResult.success && tasksResult.data ? tasksResult.data.map((taskResponse) => ({
                  id: taskResponse.id,
                  title: taskResponse.title,
                  description: taskResponse.description,
                  position: taskResponse.position,
                  status: taskResponse.status as Status,
                  dueDate: taskResponse.dueDate
                })) : []
              };
            })
          );
          setLists(listsWithTasks);
        } else {
          showNotification("Erro ao buscar dados do quadro: " + result.error, "failed");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBoardData();
  }, [boardId, setLists, setLoading, showNotification]);
}
