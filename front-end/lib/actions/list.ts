'use server';

import { getCookie } from "@/lib/utils/sessionCookie";
import { handleFetchError } from "@/lib/utils/handleFetchError";

const BASE_URL_API = process.env.BASE_URL_API || 'http://localhost:3000';

interface Task {
  id: string;
  content: string;
}

interface List {
  id: string;
  title: string;
  tasks: Task[];
  position?: number;
  boardId?: string;
}

interface NewListData {
  boardId: string;
  title: string;
  position: number;
}

interface PatchListData {
  id: string;
  title?: string;
  position?: number;
}


export async function getAllList(boardId: string) {
  const response = await fetch(`${BASE_URL_API}/v1/lists/board/${boardId}`, {
    headers: {
      'Accept': 'application/json',
      "Cookie": await getCookie("sprinttacker-session"),
    },
  });

  if (!response.ok) {
    return {
      success: false,
      error: await handleFetchError(response, 'Falha ao buscar listas'),
    };
  }

  const data = await response.json();
  return { success: true, data: data.sort((a: List, b: List) => (a.position || 0) - (b.position || 0)) };
}

export async function createList(newListData: NewListData) {
  const response = await fetch(`${BASE_URL_API}/v1/lists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      "Cookie": await getCookie("sprinttacker-session"),
    },
    body: JSON.stringify(newListData),
  });

  if (!response.ok) {
    return {
      success: false,
      error: await handleFetchError(response, 'Falha ao criar lista'),
    };
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return { success: true, data: await response.json() };
  } else {
    const responseText = await response.text();
    return {
      success: false,
      error: responseText || 'Falha ao criar lista: formato de resposta inesperado do servidor.',
    };
  }
}

export async function editList(List: PatchListData) {
  const updateData: Partial<Omit<PatchListData, 'id'>> = {};
  if (List.title !== undefined) {
    updateData.title = List.title;
  }
  if (List.position !== undefined) {
    updateData.position = List.position;
  }

  const response = await fetch(`${BASE_URL_API}/v1/lists/${List.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      "Cookie": await getCookie("sprinttacker-session"),
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    return {
      success: false,
      error: await handleFetchError(response, 'Falha ao editar lista'),
    };
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return { success: true, data: await response.json() };
  } else {
    return { success: true, data: null };
  }
}

export async function deleteList(listId: string) {
  const response = await fetch(`${BASE_URL_API}/v1/lists/${listId}`, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      "Cookie": await getCookie("sprinttacker-session"),
    },
  });

  if (!response.ok) {
    return {
      success: false,
      error: await handleFetchError(response, 'Falha ao deletar lista'),
    };
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return { success: true, data: await response.json() };
  } else {
    return { success: true, data: null };
  }
}

export async function moveList(listId: string, newPosition: number) {
  const response = await fetch(`${BASE_URL_API}/v1/lists/${listId}/position`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      "Cookie": await getCookie("sprinttacker-session"),
    },
    body: JSON.stringify({ newPosition }),
  });

  if (!response.ok) {
    return {
      success: false,
      error: await handleFetchError(response, 'Falha ao mover lista'),
    };
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return { success: true, data: await response.json() };
  } else {
    return { success: true, data: null };
  }
}
