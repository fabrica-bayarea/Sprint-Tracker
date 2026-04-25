"use client";

import React, { use } from 'react';

import BoardLists from '@/components/features/dashboard/selectedDashboard/boardLists';
import Section from '@/components/features/dashboard/selectedDashboard/section';
import CreateListModal from '@/components/features/dashboard/selectedDashboard/CreateList';
import CreateTaskModal from '@/components/features/dashboard/selectedDashboard/CreateTask';
import TaskDetailsModal from '@/components/features/dashboard/selectedDashboard/taskDetailsModal';
import RenameListModal from '@/components/features/dashboard/selectedDashboard/RenameList';
import EditTaskModal from '@/components/features/dashboard/selectedDashboard/EditTask';

import { useModalStore } from '@/lib/stores/modal';
import { useBoardStore } from '@/lib/stores/board';

import styles from './style.module.css';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = use(params);

  const { openCreateListModal } = useModalStore();
  const { boardTitle } = useBoardStore();

  return (
    <main className={styles.dashboardMainCustom}>
      <Section
        title={boardTitle || '...'}
        actionButton={openCreateListModal}
      >
        <BoardLists boardId={boardId}/>
      </Section>
      <EditTaskModal/>
      <CreateListModal boardId={boardId}/>
      <CreateTaskModal/>
      <TaskDetailsModal/>
      <RenameListModal/>
    </main>
  );
}
