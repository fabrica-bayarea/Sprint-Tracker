"use server"

import { apiClient } from "@/lib/utils/apiClient";
import { setSessioCookie } from "@/lib/utils/sessionCookie";

export async function login(email: string, password: string, rememberMe: boolean) {
  const result = await apiClient<{ message: string }>('/v1/auth/signin', {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
    errorMessage: "Erro ao fazer login",
    requiresAuth: false,
    returnResponse: true,
  });

  if (!result.success) return result;

  const rawSetCookie = result.response!.headers.get("set-cookie");
  await setSessioCookie(rawSetCookie!);

  return { success: true as const, data: { message: 'success' } };
}

export async function register(fullName: string, userName: string, email: string, password: string) {
  const result = await apiClient<{ message: string }>('/v1/auth/signup', {
    method: "POST",
    body: JSON.stringify({ name: fullName, userName, email, password }),
    errorMessage: "Erro ao fazer registro",
    requiresAuth: false,
    returnResponse: true,
  });

  if (!result.success) return result;

  const rawSetCookie = result.response!.headers.get("set-cookie");
  await setSessioCookie(rawSetCookie!);

  return { success: true as const, data: { message: 'success' } };
}

export async function forgotPassword(email: string) {
  return apiClient<{ message: string }>('/v1/auth/forgot-password', {
    method: "PATCH",
    body: JSON.stringify({ email }),
    errorMessage: "Erro ao solicitar redefinição de senha",
    requiresAuth: false,
  });
}

export async function verifyCodeResetPassword(code: string) {
  const result = await apiClient<{ message: string }>('/v1/auth/verify-reset-code', {
    method: "POST",
    body: JSON.stringify({ code }),
    errorMessage: "Codigo de verificação inválido",
    requiresAuth: false,
    returnResponse: true,
  });

  if (!result.success) return result;

  const rawSetCookie = result.response!.headers.get("set-cookie");
  await setSessioCookie(rawSetCookie!);

  return { success: true as const, data: { message: 'success' } };
}

export async function resetPassword(newPassword: string, confirmNewPassword: string) {
  return apiClient<{ message: string }>('/v1/auth/reset-password', {
    method: "POST",
    body: JSON.stringify({ newPassword, confirmNewPassword }),
    errorMessage: "Erro ao redefinir senha",
    requiresAuth: true,
    cookieName: "reset-token",
  });
}
