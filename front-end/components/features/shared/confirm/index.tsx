"use client"

import React, { useEffect, useCallback } from 'react'

import { useConfirmStore } from '@/lib/stores/confirm'

import styles from './style.module.css'

export default function Confirm() {
  const { isOpen, message, confirmText, cancelText, confirm, cancel, hideConfirm } = useConfirmStore()

  const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      cancel()
    }
  }

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return
    if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      confirm()
    }
  }, [isOpen, confirm, cancel])

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onKeyDown])

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onOverlayClick}>
      <div className={styles.modalContent} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className={styles.header}>
          <h2 id="confirm-title">Confirmação</h2>
          <button className={styles.iconButton} onClick={hideConfirm} aria-label="Fechar">×</button>
        </div>

        <div className={styles.message}>
          {message}
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={cancel}>
            {cancelText}
          </button>
          <button className={styles.confirmButton} onClick={confirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
