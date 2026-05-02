'use server';

import { getCookie } from "@/lib/utils/sessionCookie";
import { env } from "@/lib/config/env";

interface ApiOptions extends RequestInit {
  errorMessage?: string;
  requiresAuth?: boolean;
  returnResponse?: boolean;
  cookieName?: string;
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  response?: Response;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Cliente HTTP genérico para comunicação com a API
 * 
 * @template T - Tipo esperado da resposta da API
 * @param endpoint - Caminho do endpoint (ex: '/v1/boards')
 * @param options - Opções da requisição (method, body, headers, etc)
 * @returns Promise com resultado { success: true, data: T } ou { success: false, error: string }
 * 
 * @example
 * const result = await apiClient<Board[]>('/v1/boards', {
 *   method: 'GET',
 *   errorMessage: 'Falha ao buscar boards'
 * });
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { 
    errorMessage = "Falha na requisição", 
    requiresAuth = true,
    returnResponse = false,
    cookieName = "sprinttacker-session",
    ...fetchOptions 
  } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Adiciona cookie de autenticação se necessário
  if (requiresAuth) {
    const cookie = await getCookie(cookieName);
    if (cookie) {
      headers["Cookie"] = cookie;
    }
  }

  const response = await fetch(`${env.apiUrl}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let errorMsg = errorMessage;

    try {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await response.json();
        errorMsg = data.message || data.error || errorMsg;
      } else {
        const text = await response.text();
        errorMsg = text || errorMsg;
      }
    } catch {
      // ignorar erro ao tentar extrair mensagem
    }

    return {
      success: false,
      error: errorMsg,
    };
  }

  const data = await response.json().catch(() => undefined) as T;
  
  if (returnResponse) {
    return { success: true, data, response };
  }
  
  return { success: true, data };
}
