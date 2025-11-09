"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getUserFromCookie } from "@/lib/utils/sessionCookie";
import { getBoardMembers } from "@/lib/actions/board";
import { BoardRole as BoardRoleEnum } from "@/lib/types/board";

export type BoardRole = BoardRoleEnum | null;

type LocalizedRole = "Administrador" | "Membro" | "Observador";

interface BoardMemberItem {
  id: string;
  name: string;
  email: string;
  role: LocalizedRole;
}

type GetBoardMembersSuccess = { success: true; data: BoardMemberItem[] };
type GetBoardMembersError = { success: false; error: string };
type GetBoardMembersResponse = GetBoardMembersSuccess | GetBoardMembersError;

export interface BoardRoleState {
  role: BoardRole;
  userId?: string | number;
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
}

const BoardRoleContext = createContext<BoardRoleState | undefined>(undefined);

interface ProviderProps {
  boardId: string;
  children: React.ReactNode;
}

export function BoardRoleProvider({ boardId, children }: ProviderProps) {
  const [state, setState] = useState<BoardRoleState>({
    role: null,
    userId: undefined,
    loading: true,
    error: undefined,
    refresh: async () => { },
  });

  // Regras simples baseadas no exemplo do getBoardMembers
  // [{ userId, role: 'ADMIN' | 'MEMBER' | 'OBSERVER', user: { id, ... } }]
  // Se não estiver na lista de membros => null (sem permissões)

  const refresh = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));

      const user = await getUserFromCookie();
      const userId = (user as { sub?: string } | null)?.sub ?? null;
      if (!userId) {
        setState((prev) => ({
          ...prev,
          role: null,
          userId: undefined,
          loading: false,
          error: "Usuário não autenticado",
        }));
        return;
      }

      const membersResp = (await getBoardMembers(boardId)) as GetBoardMembersResponse;

      if (!membersResp.success) {
        throw new Error(membersResp.error || "Falha ao buscar membros do quadro");
      }

      const members = membersResp.data;
      const myMember = members.find((m: BoardMemberItem) => String(m.id) === String(userId));

      let role: BoardRole = null;

      if (myMember && typeof myMember.role === "string") {
        const r = String(myMember.role);
        if (r === "Administrador") {
          role = BoardRoleEnum.ADMIN;
        } else if (r === "Membro") {
          role = BoardRoleEnum.MEMBER;
        } else {
          role = BoardRoleEnum.OBSERVER;
        }
      }

      setState({
        role,
        userId,
        loading: false,
        error: undefined,
        refresh,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao carregar permissões do usuário";
      setState((prev) => ({
        ...prev,
        role: null,
        loading: false,
        error: message,
        refresh,
      }));
    }
  }, [boardId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => state, [state]);

  return <BoardRoleContext.Provider value={value}>{children}</BoardRoleContext.Provider>;
}

export function useBoardRole() {
  const ctx = useContext(BoardRoleContext);
  if (!ctx) throw new Error("useBoardRole deve ser usado dentro de BoardRoleProvider");
  return ctx;
}
