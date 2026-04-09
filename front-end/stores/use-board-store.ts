import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BoardState {
  selectedBoardId: string | null;
  setSelectedBoardId: (id: string) => void;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set) => ({
      selectedBoardId: null,
      setSelectedBoardId: (id) => set({ selectedBoardId: id }),
    }),
    {
      name: 'board-storage',
    }
  )
);