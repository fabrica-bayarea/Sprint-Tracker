import { useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { useBoardStore } from '@/lib/stores/board';
import { useListOperations } from './useListOperations';
import { useTaskOperations } from './useTaskOperations';

export function useDragAndDrop(boardId: string) {
  const { lists, setLists, getListIndex, getTaskPosition, moveTask } = useBoardStore();
  const { handleMoveList } = useListOperations(boardId);
  const { handleMoveTask, handleMoveTaskToOtherList } = useTaskOperations();

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Lógica para arrastar listas
    const activeListIdx = getListIndex(active.id as string);
    const overListIdx = getListIndex(over.id as string);

    if (activeListIdx !== -1 && overListIdx !== -1) {
      const newLists = arrayMove(lists, activeListIdx, overListIdx);
      setLists(newLists);
      

      const listId = active.id as string;
      const newPosition = overListIdx + 1; // Posição baseada em 1
      handleMoveList(listId, newPosition);
      
      return;
    }

    // Lógica para arrastar tarefas
    const sourcePosition = getTaskPosition(active.id as string);
    if (!sourcePosition) return;

    const { listIndex: sourceListIdx, taskIndex: taskIdx } = sourcePosition;

    // Verificar se está sendo solto em uma lista
    let destListIdx = getListIndex(over.id as string);
    let destTaskIdx = -1;

    // Se não for uma lista, verificar se é uma tarefa
    if (destListIdx === -1) {
      const destPosition = getTaskPosition(over.id as string);
      if (destPosition) {
        destListIdx = destPosition.listIndex;
        destTaskIdx = destPosition.taskIndex;
      }
    }

    if (destListIdx === -1) return;

    // Mover a tarefa no estado local
    moveTask(sourceListIdx, taskIdx, destListIdx, destTaskIdx === -1 ? undefined : destTaskIdx);
    
    // Fazer requisição para o backend
    const taskId = active.id as string;
    
    if (sourceListIdx === destListIdx) {
      // Movimento dentro da mesma lista
      const sourceList = lists[sourceListIdx];
      
      // Calcular a nova posição baseada na posição final após o movimento
      let newPosition: number;
      if (destTaskIdx === -1 || destTaskIdx === undefined) {
        // Se solto no final da lista, usar a próxima posição disponível
        newPosition = sourceList.tasks.length > 0 ? 
          Math.max(...sourceList.tasks.map(t => t.position)) + 1 : 1;
      } else {
        // Se solto entre tarefas, calcular baseado no índice de destino
        if (destTaskIdx === 0) {
          // Se movido para o início
          newPosition = sourceList.tasks.length > 0 ? 
            Math.min(...sourceList.tasks.map(t => t.position)) - 1 : 1;
        } else {
          // Se movido para o meio, usar o índice como posição
          newPosition = destTaskIdx + 1;
        }
      }
      
      handleMoveTask(taskId, newPosition);
    } else {
      // Movimento para lista diferente
      const destList = lists[destListIdx];
      const newListId = destList.id;
      
      // Calcular a nova posição na lista de destino
      let newPosition: number;
      if (destTaskIdx === -1 || destTaskIdx === undefined) {
        // Se solto no final da lista, usar a próxima posição disponível
        newPosition = destList.tasks.length > 0 ? 
          Math.max(...destList.tasks.map(t => t.position)) + 1 : 1;
      } else {
        // Se solto entre tarefas, calcular baseado no índice de destino
        if (destTaskIdx === 0) {
          // Se movido para o início
          newPosition = destList.tasks.length > 0 ? 
            Math.min(...destList.tasks.map(t => t.position)) - 1 : 1;
        } else {
          // Se movido para o meio, usar o índice como posição
          newPosition = destTaskIdx + 1;
        }
      }
      
      handleMoveTaskToOtherList(taskId, newPosition, newListId);
    }
  }, [lists, setLists, getListIndex, getTaskPosition, moveTask, handleMoveList, handleMoveTask, handleMoveTaskToOtherList]);

  return {
    handleDragEnd,
  };
}
