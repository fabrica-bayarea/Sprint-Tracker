import { create } from 'zustand'

type WarningType = 'success' | 'failed' | 'info'

type WarningState = {
  message: string
  type: WarningType
  show: boolean
  showWarning: (message: string, type: WarningType) => void
  hideWarning: () => void
}

export const useWarningStore = create<WarningState>((set) => ({
  message: '',
  type: 'info',
  show: false,
  showWarning: (message, type) => set({ message, type, show: true }),
  hideWarning: () => set({ show: false }),
}))
