import { useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { useBoardStore } from '@/lib/stores/board';
import { useListOperations } from './useListOperations';
import { useTaskOperations } from './useTaskOperations';

/**
 * Hook para gerenciar drag and drop de listas e tarefas no board
 */
export function useDragAndDrop(boardId: string) {
  const { lists, setLists, getListIndex, getTaskPosition, moveTask } = useBoardStore();
  const { handleMoveList } = useListOperations(boardId);
  const { handleMoveTask, handleMoveTaskToOtherList } = useTaskOperations();

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeListIdx = getListIndex(active.id as string);
    const overListIdx = getListIndex(over.id as string);

    if (activeListIdx !== -1 && overListIdx !== -1) {
      const newLists = arrayMove(lists, activeListIdx, overListIdx);
      setLists(newLists);

      const listId = active.id as string;
      const newPosition = overListIdx + 1;
      handleMoveList(listId, newPosition);
      
      return;
    }

    const sourcePosition = getTaskPosition(active.id as string);
    if (!sourcePosition) return;

    const { listIndex: sourceListIdx, taskIndex: taskIdx } = sourcePosition;

    let destListIdx = getListIndex(over.id as string);
    let destTaskIdx = -1;

    if (destListIdx === -1) {
      const destPosition = getTaskPosition(over.id as string);
      if (destPosition) {
        destListIdx = destPosition.listIndex;
        destTaskIdx = destPosition.taskIndex;
      }
    }

    if (destListIdx === -1) return;

    moveTask(sourceListIdx, taskIdx, destListIdx, destTaskIdx === -1 ? undefined : destTaskIdx);
    
    const taskId = active.id as string;
    
    if (sourceListIdx === destListIdx) {
      const sourceList = lists[sourceListIdx];
      
      let newPosition: number;
      if (destTaskIdx === -1 || destTaskIdx === undefined) {
        newPosition = sourceList.tasks.length > 0 ? 
          Math.max(...sourceList.tasks.map(t => t.position)) + 1 : 1;
      } else {
        if (destTaskIdx === 0) {
          newPosition = sourceList.tasks.length > 0 ? 
            Math.min(...sourceList.tasks.map(t => t.position)) - 1 : 1;
        } else {
          newPosition = destTaskIdx + 1;
        }
      }
      
      handleMoveTask(taskId, newPosition);
    } else {
      const destList = lists[destListIdx];
      const newListId = destList.id;
      
      let newPosition: number;
      if (destTaskIdx === -1 || destTaskIdx === undefined) {
        newPosition = destList.tasks.length > 0 ? 
          Math.max(...destList.tasks.map(t => t.position)) + 1 : 1;
      } else {
        if (destTaskIdx === 0) {
          newPosition = destList.tasks.length > 0 ? 
            Math.min(...destList.tasks.map(t => t.position)) - 1 : 1;
        } else {
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
