"use client";

import React, { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';

import { useBoardStore } from '@/lib/stores/board';
import { useNotificationStore } from '@/lib/stores/notification';
import { addBoardMember, removeBoardMember, getBoardMembers } from '@/lib/actions/boardMember';

import { Input } from '@/components/ui';

import styles from './style.module.css';

interface MembersModalProps {
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MembersModal({ boardId, isOpen, onClose }: MembersModalProps) {
  const { members, setMembers, isCurrentUserAdmin } = useBoardStore();
  const { showNotification } = useNotificationStore();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'ADMIN' | 'OBSERVER'>('MEMBER');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const refreshMembers = async () => {
    const r = await getBoardMembers(boardId);
    if (r.success && r.data) setMembers(r.data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    const result = await addBoardMember(boardId, email.trim(), role);
    if (result.success) {
      showNotification('Membro adicionado com sucesso!', 'success');
      setEmail('');
      setRole('MEMBER');
      await refreshMembers();
    } else {
      showNotification(result.error || 'Erro ao adicionar membro', 'failed');
    }
    setLoading(false);
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remover "${name}" do board?`)) return;
    const result = await removeBoardMember(boardId, userId);
    if (result.success) {
      showNotification('Membro removido', 'success');
      await refreshMembers();
    } else {
      showNotification(result.error || 'Erro ao remover membro', 'failed');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <h2>Membros do board</h2>

        <ul className={styles.list}>
          {members.map((m) => (
            <li key={m.userId} className={styles.row}>
              <div className={styles.info}>
                <strong>{m.name}</strong>
                <span className={styles.email}>{m.email}</span>
              </div>
              <span className={`${styles.badge} ${styles[`badge_${m.role}`] || ''}`}>
                {m.role === 'OWNER' ? 'Dono' : m.role}
              </span>
              {isCurrentUserAdmin && m.role !== 'OWNER' && (
                <button
                  className={styles.removeBtn}
                  onClick={() => handleRemove(m.userId, m.name)}
                  title="Remover membro"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>

        {isCurrentUserAdmin && (
          <form className={styles.addForm} onSubmit={handleAdd}>
            <h3>Adicionar membro</h3>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'MEMBER' | 'ADMIN' | 'OBSERVER')}
              className={styles.select}
            >
              <option value="MEMBER">Membro</option>
              <option value="ADMIN">Administrador</option>
              <option value="OBSERVER">Observador</option>
            </select>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <UserPlus size={16} /> {loading ? 'Adicionando...' : 'Adicionar'}
            </button>
          </form>
        )}

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.closeBtn}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
