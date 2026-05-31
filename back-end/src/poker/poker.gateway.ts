import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { AuthService } from '@/auth/auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { BaseGateway } from '@/events/base.gateway';

interface RoomUser {
  userId: string;
  userName?: string;
  hasVoted: boolean;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class PokerGateway extends BaseGateway {
  constructor(
    authService: AuthService,
    private readonly prisma: PrismaService,
  ) {
    super(authService);
  }

  // Mantém o estado dos usuários por sala: roomKey -> Map<userId, RoomUser>
  private readonly roomUsers = new Map<string, Map<string, RoomUser>>();

  private getPokerRoom(sessionId: string) {
    return `poker:${sessionId}`;
  }

  private getRoomUsers(room: string): Map<string, RoomUser> {
    if (!this.roomUsers.has(room)) {
      this.roomUsers.set(room, new Map());
    }
    return this.roomUsers.get(room)!;
  }

  @SubscribeMessage('joinPokerSession')
  public async joinPokerSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const sessionId = data?.sessionId;
    if (!sessionId) return { ok: false, reason: 'sessionId obrigatório' };

    const userId: string | undefined = this.getClientUser(client)?.id;
    if (!userId) return { ok: false, reason: 'não autenticado' };

    const session = await this.prisma.pokerSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return { ok: false, reason: 'sessão não encontrada' };

    const member = await this.prisma.boardMember.findFirst({
      where: { boardId: session.boardId, userId },
    });
    if (!member) return { ok: false, reason: 'sem acesso a este board' };

    const room = this.getPokerRoom(sessionId);
    const users = this.getRoomUsers(room);

    // Máximo de 5 pessoas por mesa
    if (users.size >= 5) {
      return { ok: false, reason: 'A mesa está cheia (máximo 5 jogadores)' };
    }

    await client.join(room);
    this.logger.log(`Client ${client.id} entrou na sala ${room}`);

    const userName = this.getClientUser(client)?.name;

    // Registra o novo usuário ANTES de montar o snapshot
    // para que o próprio usuário apareça na lista
    users.set(userId, { userId, userName, hasVoted: false });

    // Envia snapshot completo (incluindo o próprio usuário) para o recém-chegado
    const currentUsers = Array.from(users.values());
    client.emit('pokerSessionState', {
      sessionId,
      users: currentUsers,
      pokerStatus: session.pokerStatus,
    });

    // Avisa todos os OUTROS sobre o novo participante
    client.to(room).emit('pokerUserJoined', {
      sessionId,
      userId,
      userName,
    });

    return { ok: true, room };
  }

  @SubscribeMessage('leavePokerSession')
  public async leavePokerSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    const sessionId = data?.sessionId;
    if (!sessionId) return { ok: false, reason: 'sessionId obrigatório' };

    const userId = this.getClientUser(client)?.id;
    const room = this.getPokerRoom(sessionId);
    await client.leave(room);
    this.logger.log(`Client ${client.id} saiu da sala ${room}`);

    if (userId) {
      const users = this.getRoomUsers(room);
      users.delete(userId);
    }

    this.server.to(room).emit('pokerUserLeft', {
      sessionId,
      userId,
    });

    return { ok: true, room };
  }

  // Chamado pelo PokerService para marcar voto no estado da sala
  public markUserVoted(sessionId: string, userId: string) {
    const room = this.getPokerRoom(sessionId);
    const users = this.getRoomUsers(room);
    const user = users.get(userId);
    if (user) {
      users.set(userId, { ...user, hasVoted: true });
    }
  }

  // Chamado pelo PokerService para resetar votos (nova rodada)
  public resetRoomVotes(sessionId: string) {
    const room = this.getPokerRoom(sessionId);
    const users = this.getRoomUsers(room);
    for (const [uid, user] of users.entries()) {
      users.set(uid, { ...user, hasVoted: false });
    }
  }

  public getRoomUserCount(sessionId: string): number {
    const room = this.getPokerRoom(sessionId);
    return this.getRoomUsers(room).size;
  }

  public emitPokerEvent(sessionId: string, event: string, payload: any): boolean {
    if (!this.server) {
      this.logger.error('WebSocket server não inicializado!');
      return false;
    }

    const room = this.getPokerRoom(sessionId);
    this.server.to(room).emit(event, payload);
    this.logger.log(
      `Evento '${event}' emitido para a sala: ${room} | sessionId=${sessionId}`,
    );

    return true;
  }
}


