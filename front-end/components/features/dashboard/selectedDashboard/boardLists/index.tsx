"use client";
import React from 'react';

import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';

import { useBoardStore } from '@/lib/stores/board';
import { useDragAndDrop } from '@/lib/hooks/useDragAndDrop';
import { useBoardData } from '@/lib/hooks/useBoardData';

import SortableItem from '@/components/features/dashboard/selectedDashboard/sortableItem';
import ListCard from '@/components/features/dashboard/selectedDashboard/listCard';

import styles from './style.module.css';

export default function BoardLists({ boardId }: { boardId: string }) {
  const { handleDragEnd } = useDragAndDrop(boardId);
  const { lists } = useBoardStore();

  useBoardData(boardId);

  return (
    <>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
          <div className={styles.listsContainer}>
            {lists.map((list) => (
              <SortableItem key={list.id} id={list.id}>
                <ListCard
                  list={list}
                />
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
