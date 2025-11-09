"use client";

import { io, type Socket } from "socket.io-client";
import { env } from "@/lib/config/env";

/**
 * Instância singleton do socket WebSocket.
 * Mantém uma única conexão ativa durante todo o ciclo de vida da aplicação.
 * @private
 */
let socket: Socket | null = null;

/**
 * Obtém ou cria uma instância singleton do socket WebSocket.
 * 
 * Esta função implementa o padrão Singleton para garantir que apenas uma conexão
 * WebSocket seja mantida durante toda a sessão do usuário. Se uma conexão já existe,
 * ela é retornada; caso contrário, uma nova conexão é estabelecida.
 * 
 * @returns {Socket} Instância do socket Socket.IO configurada e conectada
 * 
 * @example
 * ```tsx
 * const socket = getSocket();
 * socket.emit('joinBoard', { boardId: '123' });
 * socket.on('taskUpdated', (data) => console.log(data));
 * ```
 * 
 * @remarks
 * - A URL de conexão é configurada através da variável de ambiente `BASE_URL_WS`
 * - O path customizado pode ser definido via `BASE_URL_WS_PATH` (padrão: "/socket.io")
 * - Utiliza apenas transporte WebSocket para melhor performance
 * - Credenciais são enviadas automaticamente (withCredentials: true)
 * - Reconexão automática configurada com delays progressivos (1s a 5s)
 * - Em ambiente de desenvolvimento, eventos de conexão são logados no console
 */
export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(env.wsUrl, {
    path: env.wsPath,
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  if (env.isDev) {
    socket.on("connect", () => {
      console.log("[ws] conectado:", socket?.id);
    });
    socket.on("connect_error", (err) => {
      console.warn("[ws] erro de conexão:", err?.message || err);
    });
    socket.on("disconnect", (reason) => {
      console.log("[ws] desconectado:", reason);
    });
  }

  return socket;
}
