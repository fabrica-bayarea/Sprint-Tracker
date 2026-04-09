import { create } from 'zustand'

type NotificationType = 'success' | 'failed' | 'info'

type NotificationState = {
  message: string
  type: NotificationType
  show: boolean
  showNotification: (message: string, type: NotificationType) => void
  hideNotification: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  message: '',
  type: 'info',
  show: false,
  showNotification: (message, type) => set({ message, type, show: true }),
  hideNotification: () => set({ show: false }),
}))
