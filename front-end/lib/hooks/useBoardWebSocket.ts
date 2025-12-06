import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { useBoardStore } from '@/lib/stores/board';
import { useWarningStore } from '@/lib/stores/warning';
import { getAllList, getListById } from '@/lib/actions/list';
import { List, listResponseToList } from '@/lib/types/board';
import { env } from '@/lib/config/env';

interface BoardModifiedPayload {
  boardId: string;
  action?: string;
  byUserId?: string;
  at?: string;
}

/**
 * Hook para gerenciar a conexão WebSocket de um board específico
 * Conecta à sala do board, escuta eventos de modificação e atualiza os dados automaticamente
 * quando outros usuários fazem alterações no board
 */
export function useBoardWebSocket(boardId: string) {
  const { setLists } = useBoardStore();
  const { showWarning } = useWarningStore();
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const isJoinedRef = useRef(false);

  useEffect(() => {
    if (!boardId) return;

    const socket = getSocket();
    socketRef.current = socket;

    const reloadBoardData = async () => {
      try {
        showWarning('Atualizando quadro...', 'info');
        
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

          showWarning('Quadro atualizado!', 'success');
          
          if (env.isDev) {
            console.log('[ws] Board atualizado automaticamente:', boardId);
          }
        } else {
          showWarning('Erro ao atualizar quadro', 'failed');
        }
      } catch (error) {
        console.error('[ws] Erro ao recarregar dados do board:', error);
        showWarning('Erro ao atualizar quadro', 'failed');
      }
    };

    const handleBoardModified = (payload: BoardModifiedPayload) => {
      if (payload.boardId === boardId) {
        if (env.isDev) {
          console.log('[ws] Board modificado:', payload);
        }
        reloadBoardData();
      }
    };

    const joinBoardRoom = () => {
      if (isJoinedRef.current) return;
      
      socket.emit('joinBoard', { boardId }, (response: { ok: boolean; reason?: string; room?: string }) => {
        if (response.ok) {
          isJoinedRef.current = true;
          if (env.isDev) {
            console.log('[ws] Entrou na sala do board:', response.room);
          }
        } else {
          console.error('[ws] Erro ao entrar na sala do board:', response.reason);
        }
      });
    };

    if (socket.connected) {
      joinBoardRoom();
    }

    socket.on('connect', joinBoardRoom);
    socket.on('boardModified', handleBoardModified);

    return () => {
      if (isJoinedRef.current) {
        socket.emit('leaveBoard', { boardId }, (response: { ok: boolean }) => {
          if (response.ok && env.isDev) {
            console.log('[ws] Saiu da sala do board:', boardId);
          }
        });
        isJoinedRef.current = false;
      }
      
      socket.off('connect', joinBoardRoom);
      socket.off('boardModified', handleBoardModified);
    };
  }, [boardId, setLists, showWarning]);

  return {
    socket: socketRef.current,
    isJoined: isJoinedRef.current
  };
}
