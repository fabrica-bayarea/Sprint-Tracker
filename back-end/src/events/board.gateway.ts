import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { AuthService } from '@/auth/auth.service';
import { PrismaService } from '@/prisma/prisma.service';

import { BaseGateway } from './base.gateway';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class BoardGateway extends BaseGateway {
  constructor(
    authService: AuthService,
    private readonly prisma: PrismaService,
  ) {
    super(authService);
  }

  /**
   * Nome da sala de um board
   */
  private getBoardRoom(boardId: string) {
    return `board:${boardId}`;
  }

  /**
   * Cliente entra na sala do board, após validação de membresia
   */
  @SubscribeMessage('joinBoard')
  public async joinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string },
  ) {
    const boardId = data?.boardId;
    if (!boardId) return { ok: false, reason: 'boardId obrigatório' };

    const userId: string | undefined = this.getClientUser(client)?.id;
    if (!userId) return { ok: false, reason: 'não autenticado' };

    const member = await this.prisma.boardMember.findFirst({
      where: { boardId, userId },
      select: { userId: true },
    });
    if (!member) return { ok: false, reason: 'sem acesso a este board' };

    const room = this.getBoardRoom(boardId);
    await client.join(room);
    this.logger.log(`Client ${client.id} entrou na sala ${room}`);
    return { ok: true, room };
  }

  /**
   * Cliente sai da sala do board
   */
  @SubscribeMessage('leaveBoard')
  public async leaveBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string },
  ) {
    const boardId = data?.boardId;
    if (!boardId) return { ok: false, reason: 'boardId obrigatório' };

    const room = this.getBoardRoom(boardId);
    await client.leave(room);
    this.logger.log(`Client ${client.id} saiu da sala ${room}`);
    return { ok: true, room };
  }

  /**
   * Emite um evento de modificação do board para todos na sala do board.
   * Evento: 'boardModified'
   */
  public emitModifiedInBoard(
    boardId: string,
    payload: {
      boardId: string;
      action?: string;
      byUserId?: string;
      at?: string;
    },
  ): boolean {
    if (!this.server) {
      this.logger.error('WebSocket server não inicializado!');
      return false;
    }

    const room = this.getBoardRoom(boardId);
    const socketsRoom = this.server.sockets.adapter.rooms.get(room);
    if (!socketsRoom || socketsRoom.size === 0) {
      this.logger.warn(`Nenhum cliente conectado na sala ${room}`);
    }

    this.server.to(room).emit('boardModified', payload);
    this.logger.log(
      `Evento 'boardModified' emitido para a sala: ${room} | boardId=${payload.boardId} action=${payload.action ?? 'updated'}`,
    );

    return true;
  }
}
