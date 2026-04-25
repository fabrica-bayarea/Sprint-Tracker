'use server';

import { handleFetchError } from '@/lib/utils/handleFetchError';
import { getCookie } from '@/lib/utils/sessionCookie';

const BASE_URL_API = process.env.BASE_URL_API || 'http://localhost:3000';

export interface BoardMemberAPI {
  userId: string;
  name: string;
  email: string;
  userName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'OBSERVER';
}

export async function getBoardMembers(boardId: string) {
  try {
    const response = await fetch(`${BASE_URL_API}/v1/boards/${boardId}/members`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await getCookie('trello-session'),
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: await handleFetchError(response, 'Falha ao buscar membros do board'),
      };
    }

    const data: BoardMemberAPI[] = await response.json();
    return { success: true, data };
  } catch {
    return { success: false, error: 'Falha ao buscar membros do board' };
  }
}

export async function addBoardMember(
  boardId: string,
  email: string,
  role: 'ADMIN' | 'MEMBER' | 'OBSERVER' = 'MEMBER',
) {
  try {
    const response = await fetch(`${BASE_URL_API}/v1/boards/${boardId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await getCookie('trello-session'),
      },
      body: JSON.stringify({ email, role }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: await handleFetchError(response, 'Falha ao adicionar membro'),
      };
    }

    return { success: true, data: await response.json() };
  } catch {
    return { success: false, error: 'Falha ao adicionar membro' };
  }
}

export async function removeBoardMember(boardId: string, userId: string) {
  try {
    const response = await fetch(
      `${BASE_URL_API}/v1/boards/${boardId}/members/${userId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await getCookie('trello-session'),
        },
      },
    );

    if (!response.ok) {
      return {
        success: false,
        error: await handleFetchError(response, 'Falha ao remover membro'),
      };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Falha ao remover membro' };
  }
}
