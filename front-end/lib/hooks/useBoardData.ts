import { useEffect } from 'react';

import { getAllList } from '@/lib/actions/list';
import { getTasksByList } from '@/lib/actions/task';
import { getUserBoardRole, getBoardById } from '@/lib/actions/board';
import { useBoardStore } from '@/lib/stores/board';
import { useNotificationStore } from '@/lib/stores/notification';

import { List, Status } from '@/lib/types/board'

export function useBoardData(boardId: string) {
  const { setLists, setLoading, setIsCurrentUserAdmin, setBoardTitle } = useBoardStore();
  const { showNotification } = useNotificationStore();

  useEffect(() => {
    if (!boardId) return;

    const fetchBoardData = async () => {
      setLoading(true);

      try {
        const [listsResult, roleResult, boardResult] = await Promise.all([
          getAllList(boardId),
          getUserBoardRole(boardId),
          getBoardById(boardId),
        ]);

        if (roleResult.success && roleResult.data) {
          const role = roleResult.data;
          setIsCurrentUserAdmin(role === 'OWNER' || role === 'ADMIN');
        }

        if (boardResult.success && boardResult.data) {
          setBoardTitle(boardResult.data.name);
        }

        if (listsResult.success) {
          const listsWithTasks = await Promise.all(
            (listsResult.data || []).map(async (list: List) => {
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
          showNotification("Erro ao buscar dados do quadro: " + listsResult.error, "failed");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBoardData();
  }, [boardId, setLists, setLoading, setIsCurrentUserAdmin, setBoardTitle, showNotification]);
}
