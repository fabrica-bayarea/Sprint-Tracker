"use server";

import api from "@/lib/api/axios";
import { handleAxiosError } from "@/lib/utils/handle-axios-error";

export async function getUserProfile() {
  try {
    const response = await api.get("/profile");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Erro ao obter perfil do usuário"),
    };
  }
}

export async function updateUserProfile(formData: { name: string; userName: string; email: string; }) {
  try {
    const response = await api.put("/profile", formData);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Erro ao atualizar perfil"),
    };
  }
}

export async function deleteUserProfile() {
  try {
    const response = await api.delete("/profile");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Erro ao deletar perfil"),
    };
  }
}
