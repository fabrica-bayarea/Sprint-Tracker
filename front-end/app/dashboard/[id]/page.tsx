"use client";

import React, { use, useEffect, useState } from 'react';
import { Plus, Users, ChartLine } from 'lucide-react';

import BoardLists from '@/components/features/dashboard/selectedDashboard/boardLists';
import CreateListModal from '@/components/features/dashboard/selectedDashboard/CreateList';
import MembersModal from '@/components/features/dashboard/selectedDashboard/members';
import CreateTaskModal from '@/components/features/dashboard/selectedDashboard/CreateTask';
import EditTaskModal from '@/components/features/dashboard/selectedDashboard/EditTask';
import TaskDetailsModal from '@/components/features/dashboard/selectedDashboard/taskDetailsModal';

import { getBoardById } from "@/lib/actions/board";
import { useWarningStore } from '@/lib/stores/warning';
import { useModalStore } from '@/lib/stores/modal';

import styles from './style.module.css';
import { BoardRoleProvider, useBoardRole } from '@/lib/contexts/BoardRoleContext';

function CreateListButton() {
  const { role, loading } = useBoardRole();
  const { openCreateListModal } = useModalStore();

  const canCreate = !loading && (role === 'ADMIN' || role === 'MEMBER');
  if (!canCreate) return null;

  return (
    <button className={`${styles.button} ${styles['button--primary']}`} onClick={openCreateListModal}>
      <Plus size={27} /> Criar coluna
    </button>
  );
}

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: boardId } = use(params);
  const [title, setTitle] = useState("");
  const { showWarning } = useWarningStore()

  const { openMembersModal } = useModalStore();

  useEffect(() => {
    async function fetchGetBoard() {
      const response = await getBoardById(boardId);

      if (!response.success) {
        showWarning(response.error || "Erro ao carregar quadro", 'failed')
      } else {
        setTitle(response.data?.name);
      }
    }

    fetchGetBoard();
  }, [boardId, showWarning]);

  return (
    <BoardRoleProvider boardId={boardId}>
      <main className={styles.dashboardMainCustom}>
        <section className={styles.board}>
          <header className={styles.board__header}>
            <h1 className={styles.board__title}>{title}</h1>
            <div className={styles.board__actions} role="group" aria-label="Ações do quadro">
              <button className={`${styles.button} ${styles['button--neutral']}`}>
                <ChartLine size={27} strokeWidth={1}/> Relatorios
              </button>
              <button className={`${styles.button} ${styles['button--neutral']}`} onClick={openMembersModal}>
                <Users size={27} strokeWidth={1.5}/> Membros
              </button>
              <CreateListButton />
            </div>
          </header>
          <BoardLists boardId={ boardId }/>
        </section>

        <CreateListModal boardId={ boardId }/>
        <CreateTaskModal />
        <TaskDetailsModal />
        <EditTaskModal />
        <MembersModal/>
      </main>
    </BoardRoleProvider>
  );
}
