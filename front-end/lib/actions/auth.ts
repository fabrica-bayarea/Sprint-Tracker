"use server"

import api from "@/lib/api/axios";
import { handleAxiosError } from "@/lib/utils/handle-axios-error";
import { setSessioCookie, getCookie } from "@/lib/utils/session-cookie";

export async function login(email: string, password: string, rememberMe: boolean) {
  try {
    const response = await api.post("/v1/auth/signin", { email, password, rememberMe });
    const rawSetCookie = response.headers["set-cookie"];
    await setSessioCookie(rawSetCookie, "sprinttacker-session");
    return { success: true, data: { message: 'success' } };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Erro ao fazer login"),
    };
  }
}

export async function register(name: string, userName: string, email: string, password: string) {
  try {
    const response = await api.post("/v1/auth/signup", { name, userName, email, password });
    const rawSetCookie = response.headers["set-cookie"];
    await setSessioCookie(rawSetCookie, "sprinttacker-session");
    return { success: true, data: { message: 'success' } };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Erro ao fazer registro"),
    };
  }
}

export async function forgotPassword(email: string) {
  try {
    await api.patch("/v1/auth/forgot-password", { email });
    return { success: true, data: { message: 'success' } };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Erro ao solicitar redefinição de senha"),
    };
  }
}

export async function verifyCodeResetPassword(code: string) {
  try {
    const response = await api.post("/v1/auth/verify-reset-code", { code });
    const rawSetCookie = response.headers["set-cookie"];
    await setSessioCookie(rawSetCookie);
    return { success: true, data: { message: 'success' } };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Codigo de verificação inválido"),
    };
  }
}

export async function resetPassword(newPassword: string, confirmNewPassword: string) {
  try {
    const resetToken = await getCookie("reset-token");

    await api.post("/v1/auth/reset-password", { newPassword, confirmNewPassword }, {
      headers: {
        "Cookie": resetToken
      }
    });

    return { success: true, data: { message: 'success' } };
  } catch (error) {
    return {
      success: false,
      error: handleAxiosError(error, "Erro ao redefinir senha"),
    };
  }
}
