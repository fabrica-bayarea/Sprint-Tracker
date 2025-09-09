import { useCallback } from 'react';
import { createList, editList, deleteList, moveList } from '@/lib/actions/list';
import { useBoardStore } from '@/lib/stores/board';
import { useModalStore } from '@/lib/stores/modal';
import { useWarningStore } from '@/lib/stores/warning';
import type { CreateListData } from '@/lib/types/board';

export function useListOperations(boardId: string) {
  const { lists, addList, renameList, removeList, updateListPosition } = useBoardStore();
  const { closeCreateListModal } = useModalStore();
  const { showWarning } = useWarningStore();

  const handleCreateList = useCallback(async (title: string) => {
    if (!title || title.trim() === "") {
      showWarning("O título da lista não pode estar vazio.", "failed");
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
      showWarning("Lista criada com sucesso!", "success");
    } else {
      showWarning("Erro ao adicionar lista: " + result.error, "failed");
    }
  }, [boardId, lists, addList, closeCreateListModal, showWarning]);

  const handleRenameList = useCallback(async (data: { id: string; title: string; }) => {
    if (!data.title || data.title.trim() === "") {
      showWarning("O título da lista não pode estar vazio.", "failed");
      return;
    }

    const result = await editList({id: data.id, title: data.title.trim()});

    if (result.success) {
      renameList(data.id, data.title.trim());
      showWarning("Lista renomeada com sucesso!", "success");
    } else {
      showWarning("Erro ao renomear lista: " + result.error, "failed");
    }
  }, [renameList, showWarning]);

  const handleDeleteList = useCallback(async (listId: string) => {
    const result = await deleteList(listId);
    if (result.success) {
      removeList(listId);
      showWarning("Lista deletada com sucesso!", "success");
    } else {
      showWarning(result.error || 'Erro ao deletar lista', "failed");
    }
  }, [removeList, showWarning]);

  const handleMoveList = useCallback(async (listId: string, newPosition: number) => {
    try {
      const result = await moveList(listId, newPosition);
      if (result.success) {
        // Atualizar a posição no store local
        updateListPosition(listId, newPosition);
        showWarning("Lista movida com sucesso!", "success");
        return true;
      } else {
        showWarning("Erro ao mover lista: " + result.error, "failed");
        return false;
      }
    } catch (error) {
      showWarning("Erro inesperado ao mover lista: " + error, "failed");
      return false;
    }
  }, [updateListPosition, showWarning]);

  return {
    handleCreateList,
    handleDeleteList,
    handleRenameList,
    handleMoveList,
  };
}
