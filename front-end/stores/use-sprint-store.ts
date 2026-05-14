import { create } from 'zustand';

type SprintView = 'Atual' | 'Histórico' | 'Burndown';

interface SprintState {
  view: SprintView;
  setView: (view: SprintView) => void;
}

export const useSprintStore = create<SprintState>((set) => ({
  view: 'Atual',
  setView: (view) => set({ view }),
}));