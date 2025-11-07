import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { User } from '@prisma/client';
import * as cookie from 'cookie';
import { Server, Socket } from 'socket.io';

import { AuthService } from '@/auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export abstract class BaseGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly socketData = new WeakMap<
    Socket,
    { user?: { id: string; name?: string } }
  >();

  constructor(private readonly authService: AuthService) {}
  logger = new Logger(`WebSocketGateway ${this.constructor.name}`);

  /**
   * Recupera o usuário autenticado associado ao socket, se existir.
   */
  protected getClientUser(
    client: Socket,
  ): { id: string; name?: string } | undefined {
    return this.socketData.get(client)?.user;
  }

  /**
   * Inicializa o servidor WebSocket.
   * Registra o servidor e loga a inicialização.
   */
  afterInit(server: Server) {
    this.server = server;
    this.logger.log('WebSocket Gateway inicializado');
  }

  /**
   * Manipula nova conexão de cliente.
   * Autentica o cliente usando o token JWT presente nos cookies.
   * Se a autenticação falhar, desconecta o cliente.
   * Se bem-sucedida, associa o usuário ao socket e o adiciona à sua sala pessoal.
   */
  async handleConnection(client: Socket) {
    try {
      const cookies = cookie.parse(client.handshake.headers.cookie || '');
      const token: string | undefined = cookies['sprinttacker-session'];

      if (!token) {
        throw new Error('Token de sessão ausente');
      }
      const user: User | null =
        await this.authService.validateUserFromToken(token);

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const safeUser: { id: string; name?: string } = {
        id: user.id,
        name: user.name ?? undefined,
      };
      this.socketData.set(client, { user: safeUser });

      await client.join(safeUser.id);

      this.logger.log(
        `Cliente conectado: ${client.id}, Usuário: ${safeUser.name ?? 'Desconhecido'}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error('Falha na autenticação do WebSocket:', message);
      client.disconnect();
    }
  }

  /**
   * Manipula desconexão de cliente.
   * Loga a desconexão com o ID do cliente e nome do usuário, se disponível.
   */
  handleDisconnect(client: Socket) {
    const meta = this.socketData.get(client);
    const userName = meta?.user?.name ?? 'Desconhecido';
    this.logger.log(`Cliente desconectado: ${client.id}, Usuário: ${userName}`);
  }
}
