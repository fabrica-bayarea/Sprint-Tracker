import React from 'react';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

import SortableItem, { useDragListeners } from '@/components/features/dashboard/selectedDashboard/sortableItem';
import TaskCard from '@/components/features/dashboard/selectedDashboard/taskCard';
import RenameListModal from '@/components/features/dashboard/selectedDashboard/RenameList';
import { BoardRole } from '@/lib/types/board';

import { Trash2, Pencil, Grip } from 'lucide-react';

import { useListOperations } from '@/lib/hooks/useListOperations';
import { useModalStore } from '@/lib/stores/modal';
import { useBoardRole } from '@/lib/contexts/BoardRoleContext';

import type { Task } from '@/lib/types/board';

import styles from './style.module.css';

interface ListCardProps {
  list: {
    id: string;
    title: string;
    tasks: Task[];
  };
}

export default function ListCard({ list }: ListCardProps) {
  const { setNodeRef } = useDroppable({ id: list.id });
  const { handleDeleteList } = useListOperations( list.id );
  const { openCreateTaskModal, openRenameListModal } = useModalStore();
  const dragListeners = useDragListeners();
  const { role, loading } = useBoardRole();
  const canManageList = !loading && (role === BoardRole.ADMIN || role === BoardRole.MEMBER);
  
  return (
    <>
      <div className={styles.listCard}>
        <div className={styles.listHeader}>
          <div className={styles.listTitleContainer}>
            {canManageList && (
              <button
                {...dragListeners}
                className={styles.dragHandle}
                title="Arrastar lista"
              >
                <Grip size={16} />
              </button>
            )}
            <div className={styles.listTitle}>{list.title}</div>
          </div>
          <div  className={styles.listActions}>
            {canManageList && (
              <>
                <button
                  onClick={() => openRenameListModal(list.id)}
                  className={styles.deleteButton}
                  title="Renomear lista"
                >
                  <Pencil size={16}/>
                </button>
                <button 
                  onClick={() => handleDeleteList(list.id)} 
                  className={styles.deleteButton}
                  title="Deletar lista"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
        {canManageList && (
          <input onClick={() => openCreateTaskModal(list.id)} className={styles.addTaskButton} type='button' value='+ Tarefa' />
        )}
        <SortableContext items={list.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div ref={setNodeRef} style={{ minHeight: 40 }}>
            {list.tasks.map((task) => (
              <SortableItem key={task.id} id={task.id}>
                <TaskCard task={task} />
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </div>
      <RenameListModal/>
    </>
  );
}
