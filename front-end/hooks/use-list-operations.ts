import { useCallback } from 'react';
import { createList, editList, deleteList, moveList } from '@/lib/actions/list';
import { useBoardStore } from '@/stores/board';
import { useModalStore } from '@/stores/modal';
import { useNotificationStore } from '@/stores/notification';
import type { CreateListData } from '@/types/board';

export function useListOperations(boardId: string) {
  const { lists, addList, renameList, removeList, updateListPosition } = useBoardStore();
  const { closeCreateListModal } = useModalStore();
  const { showNotification } = useNotificationStore();

  const handleCreateList = useCallback(async (title: string) => {
    if (!title || title.trim() === "") {
      showNotification("O título da lista não pode estar vazio.", "failed");
      return;
    }

    const newPosition = lists.length > 0 ? Math.max(...lists.map(l => l.position || 0)) + 1 : 1;
    const newListData: CreateListData = {
      boardId: boardId,
      title: title.trim(),
      position: newPosition,
      tasks: [],
    };

    const result = await createList(newListData);
    if (result.success) {
      addList({ ...result.data, tasks: result.data.tasks || [] });
      closeCreateListModal();
      showNotification("Lista criada com sucesso!", "success");
    } else {
      showNotification("Erro ao adicionar lista: " + result.error, "failed");
    }
  }, [boardId, lists, addList, closeCreateListModal, showNotification]);

  const handleRenameList = useCallback(async (data: { id: string; title: string; }) => {
    if (!data.title || data.title.trim() === "") {
      showNotification("O título da lista não pode estar vazio.", "failed");
      return;
    }

    const result = await editList({id: data.id, title: data.title.trim()});

    if (result.success) {
      renameList(data.id, data.title.trim());
      showNotification("Lista renomeada com sucesso!", "success");
    } else {
      showNotification("Erro ao renomear lista: " + result.error, "failed");
    }
  }, [renameList, showNotification]);

  const handleDeleteList = useCallback(async (listId: string) => {
    const result = await deleteList(listId);
    if (result.success) {
      removeList(listId);
      showNotification("Lista deletada com sucesso!", "success");
    } else {
      showNotification(result.error || 'Erro ao deletar lista', "failed");
    }
  }, [removeList, showNotification]);

  const handleMoveList = useCallback(async (listId: string, newPosition: number) => {
    try {
      const result = await moveList(listId, newPosition);
      if (result.success) {
        // Atualizar a posição no store local
        updateListPosition(listId, newPosition);
        showNotification("Lista movida com sucesso!", "success");
        return true;
      } else {
        showNotification("Erro ao mover lista: " + result.error, "failed");
        return false;
      }
    } catch (error) {
      showNotification("Erro inesperado ao mover lista: " + error, "failed");
      return false;
    }
  }, [updateListPosition, showNotification]);

  return {
    handleCreateList,
    handleDeleteList,
    handleRenameList,
    handleMoveList,
  };
}
