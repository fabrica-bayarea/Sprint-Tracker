"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { X, UserPlus2 } from 'lucide-react';

import { useModalStore } from '@/lib/stores/modal';
import { Input } from '@/components/ui';
import { useWarningStore } from '@/lib/stores/warning';
import { useConfirmStore } from '@/lib/stores/confirm';
import { getBoardMembers, inviteBoardMember, deleteBoardMember, updateBoardMemberRole } from '@/lib/actions/board';
import { getUserFromCookie } from '@/lib/utils/sessionCookie';
import { useParams } from 'next/navigation';
import { useBoardRole } from '@/lib/contexts/BoardRoleContext';
import { BoardRole } from '@/lib/types/board';

import styles from './style.module.css';

type Role = 'Administrador' | 'Membro' | 'Observador';

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

const ROLE_TO_API: Record<Role, BoardRole> = {
  Administrador: BoardRole.ADMIN,
  Membro: BoardRole.MEMBER,
  Observador: BoardRole.OBSERVER,
};

export default function MembersModal() {
  const { isMembersModalOpen, closeMembersModal } = useModalStore();
  const { showWarning } = useWarningStore();
  const showConfirm = useConfirmStore((s) => s.showConfirm);
  const [inviteName, setInviteName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<Role>('Observador');
  const [inviting, setInviting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { role } = useBoardRole();
  const params = useParams<{ id: string }>();
  const boardId = params?.id;

  const refreshMembers = useCallback(async () => {
    if (!boardId) return;
    const updated = await getBoardMembers(boardId);
    if (updated.success) {
      setMembers(updated.data.map((m) => ({ ...m, role: m.role as Role })));
    }
  }, [boardId]);

  useEffect(() => {
    if (!isMembersModalOpen || !boardId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const [membersRes, meRes] = await Promise.all([
        getBoardMembers(boardId),
        getUserFromCookie(),
      ]);

      if (!membersRes.success) {
        setError(membersRes.error || 'Erro ao buscar membros');
      } else {
        const mapped = membersRes.data.map((m) => ({ ...m, role: m.role as Role }));
        setMembers(mapped);
        if (meRes?.sub == null) {
          setError('Erro ao buscar o usuario');
        } else {
          setCurrentUserId(meRes.sub as string);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [isMembersModalOpen, boardId]);

  const isAdmin = useMemo(() => {
    if (!currentUserId) return false;
    const myMember = members.find((m) => m.id === currentUserId);
    return !!myMember && myMember.role === 'Administrador';
  }, [members, currentUserId]);

  if (!isMembersModalOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeMembersModal();
    }
  };

  const handleInvite = async () => {
    if (!inviteName.trim() || !boardId) return;
    setInviting(true);
    const res = await inviteBoardMember(boardId, inviteName.trim(), ROLE_TO_API[inviteRole]);
    setInviting(false);
    if (!res.success) {
      showWarning(res.error || 'Falha ao enviar convite', 'failed');
      return;
    }
    setInviteName('');
    showWarning('Convite enviado!', 'success');
    await refreshMembers();
  };

  const handleRemoveMember = async (userId: string) => {
    if (!boardId) return;
    const confirmed = await showConfirm({ message: 'Tem certeza que deseja remover este membro do board?' });
    if (!confirmed) return;
    const res = await deleteBoardMember(boardId, userId);
    if (!res.success) {
      showWarning(res.error || 'Falha ao remover membro', 'failed');
      return;
    }
    showWarning('Membro removido com sucesso', 'success');
    await refreshMembers();
  };

  const handleUpdateRole = async (userId: string, role: Role) => {
    if (!boardId) return;
    const res = await updateBoardMemberRole(boardId, userId, ROLE_TO_API[role]);
    if (!res.success) {
      showWarning(res.error || 'Falha ao atualizar cargo', 'failed');
      return;
    }
    showWarning('Cargo atualizado', 'success');
    await refreshMembers();
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h2>Lista de membros</h2>
          <button className={styles.iconButton} onClick={closeMembersModal} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <ul className={styles.membersList}>
          {loading && (
            <li className={styles.memberItem}>Carregando membros...</li>
          )}
          {error && !loading && (
            <li className={styles.memberItem}>Erro: {error}</li>
          )}
          {!loading && !error && members.length === 0 && (
            <li className={styles.memberItem}>Nenhum membro encontrado.</li>
          )}
          {!loading && !error && members.map((m) => (
            <li key={m.id} className={styles.memberItem}>
              <div className={styles.avatar}>{m.name.charAt(0)}</div>
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{m.name}</span>
                <span className={styles.memberEmail}>{m.email}</span>
              </div>
              <div className={styles.memberRight}>
                {isAdmin ? (
                  <>
                    <label className={styles.selectWrapper}>
                      <select
                        value={m.role}
                        onChange={(e) => handleUpdateRole(m.id, e.target.value as Role)}
                        aria-label={`Alterar cargo de ${m.name}`}
                      >
                        <option value="Administrador">Administrador</option>
                        <option value="Membro">Membro</option>
                        <option value="Observador">Observador</option>
                      </select>
                    </label>
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                    >
                      Remover
                    </button>
                  </>
                ) : (
                  <span className={styles.roleBadge}>
                    {m.role}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>

        {role === BoardRole.ADMIN && (
          <div className={styles.inviteBox}>
            <h3 className={styles.inviteTitle}>Convidar um usuário</h3>
            <Input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Nome do usuário para convidar"
              className={styles.modalInput}
            />
            <div className={styles.inviteRow}>
              <label className={styles.selectWrapper}>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className={styles.modalSelect}
                  aria-label="Papel do convite"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Membro">Membro</option>
                  <option value="Observador">Observador</option>
                </select>
              </label>
              <button className={styles.submitButton} onClick={handleInvite} disabled={inviting}>
                <UserPlus2 size={18} /> {inviting ? 'Enviando...' : 'Convidar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
