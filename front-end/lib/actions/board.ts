'use server';

import { handleFetchError } from "@/lib/utils/handleFetchError";
import { getCookie } from "@/lib/utils/sessionCookie";

interface BoardData {
  title: string;
  description: string;
}

interface BoardListItemAPI {
  id: string;
  title: string;
}

const BASE_URL_API = process.env.BASE_URL_API || 'http://localhost:3000';

export async function createBoard(boardData: BoardData) {
  const response = await fetch(`${BASE_URL_API}/v1/boards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": await getCookie("trello-session"),
    },
    body: JSON.stringify({
      ...boardData,
      visibility: "PRIVATE",
    }),
  });

  if (!response.ok) {
    return {
      success: false,
      error: await handleFetchError(response, "Falha ao criar o board"),
    };
  }

  return { success: true, data: { message: 'success' } };
}

export async function getBoards() {
  const response = await fetch(`${BASE_URL_API}/v1/boards`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Cookie": await getCookie("trello-session"),
    },
  });

  if (!response.ok) {
    return {
      success: false,
      error: await handleFetchError(response, "Falha ao buscar os boards"),
    };
  }

  const data: BoardListItemAPI[] = await response.json();
  return {
    success: true,
    data: data.map((board: BoardListItemAPI) => ({
      id: board.id,
      name: board.title,
      members: [],
      image: "",
    })),
  };
}

export async function getBoardById(boardId: string) {
  const response = await fetch(`${BASE_URL_API}/v1/boards/${boardId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Cookie": await getCookie("trello-session"),
    },
  });

  if (!response.ok) {
    return {
      success: false,
      error: await handleFetchError(response, "Falha ao buscar o board"),
    };
  }

  const data = await response.json();
  return {
    success: true,
    data: {
      id: data.id,
      name: data.title,
      description: data.description,
      visibility: data.visibility,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      ownerId: data.ownerId,
      lists: data.lists,
    },
  };
}

