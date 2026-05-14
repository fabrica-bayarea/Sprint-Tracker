import { create } from 'zustand'

export type ConfirmOptions = {
  message: string
  confirmText?: string
  cancelText?: string
}

export type ConfirmState = {
  isOpen: boolean
  message: string
  confirmText: string
  cancelText: string
  // Internal promise resolver to resolve the awaiting caller
  _resolve?: (value: boolean) => void
  showConfirm: (options: ConfirmOptions) => Promise<boolean>
  hideConfirm: () => void
  confirm: () => void
  cancel: () => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  _resolve: undefined,

  showConfirm: ({ message, confirmText, cancelText }) => {
    // Return a promise that will be resolved when user confirms or cancels
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        message,
        confirmText: confirmText ?? 'Confirmar',
        cancelText: cancelText ?? 'Cancelar',
        _resolve: resolve,
      })
    })
  },

  hideConfirm: () => {
    set({ isOpen: false })
    // Don't resolve here to avoid double-resolve; only on explicit confirm/cancel
  },

  confirm: () => {
    const resolver = get()._resolve
    resolver?.(true)
    set({ isOpen: false, _resolve: undefined })
  },

  cancel: () => {
    const resolver = get()._resolve
    resolver?.(false)
    set({ isOpen: false, _resolve: undefined })
  },
}))
