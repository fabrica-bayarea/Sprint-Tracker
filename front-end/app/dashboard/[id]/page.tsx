"use client";

import React, { use } from 'react';

import BoardLists from '@/features/dashboard/selectedDashboard/boardLists';
import Section from '@/features/dashboard/selectedDashboard/section';
import CreateListModal from '@/features/dashboard/selectedDashboard/CreateList';
import CreateTaskModal from '@/features/dashboard/selectedDashboard/CreateTask';
import TaskDetailsModal from '@/features/dashboard/selectedDashboard/taskDetailsModal';
import RenameListModal from '@/features/dashboard/selectedDashboard/RenameList';
import EditTaskModal from '@/features/dashboard/selectedDashboard/EditTask';

import { useModalStore } from '@/stores/modal';;

import styles from './style.module.css';

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = use(params);

  const { openCreateListModal } = useModalStore();

  return (
    <main className={styles.dashboardMainCustom}>
      <Section
        title="Bay-Area"
        actionButton={openCreateListModal}
      >
        <BoardLists boardId={ boardId }/>
      </Section>
      <EditTaskModal/>
      <CreateListModal boardId={ boardId }/>
      <CreateTaskModal/>
      <TaskDetailsModal/>
      <RenameListModal/>
    </main>
  );
}
