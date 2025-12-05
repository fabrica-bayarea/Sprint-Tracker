"use server";

import { apiClient } from "@/lib/utils/apiClient";
import { BoardRole } from "@/lib/types/board";

export interface UserProfile {
  name: string;
  userName: string;
  email: string;
  authProvider: string;
  photoUrl?: string;
}

export async function getUserProfile() {
  return apiClient<UserProfile>('/v1/me/profile', {
    method: "GET",
    errorMessage: "Erro ao obter perfil do usuário",
  });
}

export async function updateUserProfile(
  formData: { 
    name: string; 
    userName: string; 
    email?: string; 
  }) {
  return apiClient('/v1/me/profile', {
    method: "PUT",
    body: JSON.stringify(formData),
    errorMessage: "Erro ao atualizar perfil",
  });
}

export async function deleteUserProfile() {
  return apiClient('/v1/me', {
    method: "DELETE",
    errorMessage: "Erro ao deletar perfil",
  });
}

export interface UserNotification {
  id: string;
  createdAt: string;
  statusInvite: string; // PENDING | ACCEPTED | REJECTED (exemplo)
  role: BoardRole;
  sender: {
    id: string;
    name: string | null;
    userName: string | null;
  };
  board: {
    id: string;
    title: string;
  };
}

export async function getUserNotifications() {
  return apiClient<UserNotification[]>('/v1/me/notifications', {
    method: "GET",
    errorMessage: "Erro ao buscar notificações",
  });
}

