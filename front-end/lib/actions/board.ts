'use server';

import api from "@/lib/api/axios";
import { handleAxiosError } from "@/lib/utils/handle-axios-error";
import { BoardData, BoardListItemAPI } from "../../types/board";

export async function createBoard(boardData: BoardData) {
  try {
    await api.post("/boards", {
      ...boardData,
      visibility: "PRIVATE",
    });

    return { success: true, data: { message: 'success' } };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Falha ao criar o board"),
    };
  }
}

export async function getBoards() {
  try {
    const response = await api.get("/boards");
    const data: BoardListItemAPI[] = response.data;

    return {
      success: true,
      data: data.map((board: BoardListItemAPI) => ({
        id: board.id,
        name: board.title,
        members: [],
        image: "",
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Falha ao buscar os boards"),
    };
  }
}

export async function deleteBoard(boardId: string) {
  try {
    await api.delete(`/boards/${boardId}`);
    return { success: true, data: { message: 'success' } };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Falha ao remover o board"),
    };
  }
}

export async function getBoardById(boardId: string) {
  try {
    const response = await api.get(`/boards/${boardId}`);
    const data = response.data;

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
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Falha ao buscar o board"),
    };
  }
}