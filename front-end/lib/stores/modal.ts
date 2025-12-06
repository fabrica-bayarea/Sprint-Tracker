import { create } from 'zustand';
import type { Task } from '@/lib/types/board';

interface ModalState {
  // Estados dos modais
  isCreateListModalOpen: boolean;
  isCreateTaskModalOpen: boolean;
  isEditTaskModalOpen: boolean;
  isTaskDetailsModalOpen: boolean;
  isRenameListModalOpen: boolean;
  isMembersModalOpen: boolean;
  
  // Estados específicos
  selectedListId: string;
  selectedTask: Task | null;
  
  // Actions para modal de lista
  openCreateListModal: () => void;
  closeCreateListModal: () => void;
  openRenameListModal: (listId: string) => void;
  closeRenameListModal: () => void;

  // Actions para modal de tarefa
  openCreateTaskModal: (listId: string) => void;
  closeCreateTaskModal: () => void;
  openEditTaskModal: (task: Task) => void;
  closeEditTaskModal: () => void;
  
  // Actions para modal de detalhes
  openTaskDetailsModal: (task: Task) => void;
  closeTaskDetailsModal: () => void;

  // Actions para modal de membros
  openMembersModal: () => void;
  closeMembersModal: () => void;
}

export const useModalStore = create<ModalState>()((set) => ({
  // Estado inicial
  isCreateListModalOpen: false,
  isCreateTaskModalOpen: false,
  isEditTaskModalOpen: false,
  isTaskDetailsModalOpen: false,
  isRenameListModalOpen: false,
  isMembersModalOpen: false,
  selectedListId: "",
  selectedTask: null,

  // Actions para modal de lista
  openCreateListModal: () => set({ isCreateListModalOpen: true }),
  closeCreateListModal: () => set({ isCreateListModalOpen: false }),
  openRenameListModal: (listId) => set({ isRenameListModalOpen: true, selectedListId: listId }),
  closeRenameListModal: () => set({ isRenameListModalOpen: false, selectedListId: "" }),

  // Actions para modal de tarefa
  openCreateTaskModal: (listId) => set({ 
    isCreateTaskModalOpen: true, 
    selectedListId: listId 
  }),
  closeCreateTaskModal: () => set({ 
    isCreateTaskModalOpen: false, 
    selectedListId: "" 
  }),

  // Actions para modal de edição de tarefa
  openEditTaskModal: (task) => set({ 
    isEditTaskModalOpen: true, 
    selectedTask: task 
  }),
  closeEditTaskModal: () => set({ 
    isEditTaskModalOpen: false, 
    selectedTask: null 
  }),

  // Actions para modal de detalhes
  openTaskDetailsModal: (task) => set({ 
    isTaskDetailsModalOpen: true, 
    selectedTask: task 
  }),
  closeTaskDetailsModal: () => set({ 
    isTaskDetailsModalOpen: false, 
    selectedTask: null 
  }),

  // Actions para modal de membros
  openMembersModal: () => set({ isMembersModalOpen: true }),
  closeMembersModal: () => set({ isMembersModalOpen: false }),
}));
