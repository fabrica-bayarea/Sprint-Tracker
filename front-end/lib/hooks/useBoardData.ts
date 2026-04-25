import { useEffect } from 'react';

import { getAllList } from '@/lib/actions/list';
import { getTasksByList } from '@/lib/actions/task';
import { getUserBoardRole, getBoardById } from '@/lib/actions/board';
import { getBoardMembers } from '@/lib/actions/boardMember';
import { useBoardStore } from '@/lib/stores/board';
import { useNotificationStore } from '@/lib/stores/notification';

import { List, Status } from '@/lib/types/board'

export function useBoardData(boardId: string) {
  const { setLists, setLoading, setIsCurrentUserAdmin, setBoardTitle, setMembers } = useBoardStore();
  const { showNotification } = useNotificationStore();

  useEffect(() => {
    if (!boardId) return;

    const fetchBoardData = async () => {
      setLoading(true);

      try {
        const [listsResult, roleResult, boardResult, membersResult] = await Promise.all([
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
              const tasksResult = await getTasksByList(list.id);
              return {
                ...list,
                tasks: tasksResult.success && tasksResult.data ? tasksResult.data.map((taskResponse) => ({
                  id: taskResponse.id,
                  title: taskResponse.title,
                  description: taskResponse.description,
                  position: taskResponse.position,
                  status: taskResponse.status as Status,
                  dueDate: taskResponse.dueDate,
                  assigneeId: taskResponse.assigneeId ?? null,
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
  }, [boardId, setLists, setLoading, setIsCurrentUserAdmin, setBoardTitle, setMembers, showNotification]);
}
