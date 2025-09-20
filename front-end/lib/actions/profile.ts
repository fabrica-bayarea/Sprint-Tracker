"use server";

import { getCookie } from "@/lib/utils/sessionCookie";
import { handleFetchError } from "@/lib/utils/handleFetchError";

const BASE_URL_API = process.env.BASE_URL_API || 'http://localhost:3000';

export async function getUserProfile() {
  const response = await fetch(`${BASE_URL_API}/v1/profile`, {
    headers: {
      "Cookie": await getCookie("sprinttacker-session"),
    }
  });

  if (!response.ok) {
    return { 
      success: false,
      error: await handleFetchError(response, "Erro ao obter perfil do usuário"),
    };
  }
  
  return { success: true, data: await response.json() }
}

export async function updateUserProfile(formData: { name: string; userName: string; email: string; }) {


  const response = await fetch(`${BASE_URL_API}/v1/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Cookie": await getCookie("sprinttacker-session"),
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    return { 
      success: false,
      error: await handleFetchError(response, "Erro ao atualizar perfil"),
    };
  }

  return { success: true, data: await response.json() }
}

export async function deleteUserProfile() {


  const response = await fetch(`${BASE_URL_API}/v1/profile`, {
    method: "DELETE",
    headers: {
      "Cookie": await getCookie("sprinttacker-session"),
    },
  });

  if (!response.ok) {
    return { 
      success: false, 
      error: await handleFetchError(response, "Erro ao deletar perfil"),
    };
  }
  
  return { success: true, data: await response.json() }
}

