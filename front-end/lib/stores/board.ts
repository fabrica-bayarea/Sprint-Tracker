import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { List, Task } from '@/lib/types/board';

interface BoardState {
  // Estado das listas
  lists: List[];
  isLoading: boolean;
  isCurrentUserAdmin: boolean;
  boardTitle: string;

  // Actions para listas
  setLists: (lists: List[]) => void;
  setIsCurrentUserAdmin: (isAdmin: boolean) => void;
  setBoardTitle: (title: string) => void;
  addList: (list: List) => void;
  renameList: (listId: string, title: string) => void;
  removeList: (listId: string) => void;
  updateListPosition: (listId: string, position: number) => void;
  setLoading: (loading: boolean) => void;
  
  // Actions para tarefas
  addTask: (listId: string, task: Task) => void;
  removeTask: (taskId: string) => void;
  editTask: (taskId: string, updatedTask: Partial<Task>) => void;
  moveTask: (sourceListIdx: number, taskIdx: number, destListIdx: number, destTaskIdx?: number) => void;
  
  // Utils
  getNextTaskPosition: (listId: string) => number;
  getListIndex: (listId: string) => number;
  getTaskPosition: (taskId: string) => { listIndex: number; taskIndex: number } | null;
}

export const useBoardStore = create<BoardState>()(
  subscribeWithSelector((set, get) => ({
    // Estado inicial
    lists: [],
    isLoading: false,
    isCurrentUserAdmin: false,
    boardTitle: '',

    // Actions para listas
    setLists: (lists) => set({ lists }),
    setIsCurrentUserAdmin: (isAdmin) => set({ isCurrentUserAdmin: isAdmin }),
    setBoardTitle: (title) => set({ boardTitle: title }),
    
    addList: (list) => set((state) => ({
      lists: [...state.lists, list]
    })),
    
    renameList: (listId, title) => set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId ? { ...list, title } : list
      )
    })),

    removeList: (listId) => set((state) => ({
      lists: state.lists.filter(list => list.id !== listId)
    })),

    updateListPosition: (listId, position) => set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId ? { ...list, position } : list
      )
    })),
    
    setLoading: (loading) => set({ isLoading: loading }),

    // Actions para tarefas
    addTask: (listId, task) => set((state) => ({
      lists: state.lists.map((list) => {
        if (list.id === listId) {
          return {
            ...list,
            tasks: [task, ...list.tasks]
          };
        }
        return list;
      })
    })),
    
    removeTask: (taskId) => set((state) => ({
      lists: state.lists.map(list => ({
        ...list,
        tasks: list.tasks.filter(task => task.id !== taskId)
      }))
    })),
    
    editTask: (taskId, updatedTask) => set((state) => {
      const lists = state.lists.map(list => {
        const taskIndex = list.tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
          const updatedTasks = [...list.tasks];
          updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], ...updatedTask };
          return { ...list, tasks: updatedTasks };
        }
        return list;
      });
      return { lists };
    }),
    
    moveTask: (sourceListIdx, taskIdx, destListIdx, destTaskIdx) => set((state) => {
      const newLists = state.lists.map(l => ({ ...l, tasks: [...l.tasks] }));
      const [removedTask] = newLists[sourceListIdx].tasks.splice(taskIdx, 1);

      if (destTaskIdx === undefined || destTaskIdx === -1) {
        newLists[destListIdx].tasks.push(removedTask);
      } else {
        newLists[destListIdx].tasks.splice(destTaskIdx, 0, removedTask);
      }
      
      return { lists: newLists };
    }),

    // Utils
    getNextTaskPosition: (listId) => {
      const list = get().lists.find(l => l.id === listId);
      return list && list.tasks.length > 0
        ? Math.max(...list.tasks.map(t => t.position)) + 1
        : 1;
    },
    
    getListIndex: (listId) => {
      return get().lists.findIndex(l => l.id === listId);
    },
    
    getTaskPosition: (taskId) => {
      const lists = get().lists;
      for (let listIndex = 0; listIndex < lists.length; listIndex++) {
        const taskIndex = lists[listIndex].tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
          return { listIndex, taskIndex };
        }
      }
      return null;
    }
  }))
);
