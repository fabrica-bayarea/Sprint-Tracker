import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PokerStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

import { PrismaService } from '@/prisma/prisma.service';

import { CreatePokerSessionDTO } from './dto/CreateSession.dto';
import { SubmitVoteDto } from './dto/SubmitVote.dto';
import { PokerGateway } from './poker.gateway';

@Injectable()
export class PokerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pokerGateway: PokerGateway,
  ) { }

  async createPokerSession(dto: CreatePokerSessionDTO, boardId: string) {
    const inviteCode = nanoid(6);
    const procurarPorBoard = await this.prisma.board.findUnique({
      where: {
        id: boardId,
      },
    });

    if (!procurarPorBoard) {
      throw new NotFoundException('Board not found');
    }

    const pokerSession = await this.prisma.pokerSession.create({
      data: {
        title: dto.title,
        taskId: dto.taskId,
        boardId,
        pokerStatus: PokerStatus.WAITING,
        inviteCode,
      },
    });
    return pokerSession;
  }

  async listByBoard(boardId: string) {
    const sessions = await this.prisma.pokerSession.findMany({
      where: { boardId },
      orderBy: { createdAt: 'desc' },
      include: {
        task: true,
      },
    });
    return sessions.map((s) => ({
      ...s,
      taskIds: s.taskId ? [s.taskId] : [],
      participantCount: this.pokerGateway.getRoomUserCount(s.id),
    }));
  }

  async getSession(sessionId: string) {
    const session = await this.prisma.pokerSession.findUnique({
      where: { id: sessionId },
      include: { task: true },
    });
    if (!session) {
      throw new NotFoundException('Poker session not found');
    }
    return {
      ...session,
      taskIds: session.taskId ? [session.taskId] : [],
      participantCount: this.pokerGateway.getRoomUserCount(sessionId),
    };
  }

  async joinSession(inviteCode: string) {
    const findingInviteCode = await this.findSessionId(inviteCode);
    if (!findingInviteCode) {
      throw new NotFoundException('Invalid invite code');
    }
    if (findingInviteCode.pokerStatus === PokerStatus.CLOSED) {
      throw new BadRequestException('Poker session is closed');
    }
    return findingInviteCode;
  }

  async closeSession(sessionId: string) {
    const session = await this.findSessionId(sessionId);

    if (!session) {
      throw new NotFoundException('Poker session ID not found');
    }

    if (session.pokerStatus === PokerStatus.CLOSED) {
      throw new BadRequestException('This Session is already closed');
    }

    const endSession = await this.prisma.pokerSession.update({
      where: {
        id: sessionId,
      },
      data: {
        pokerStatus: PokerStatus.CLOSED,
      },
      include: {
        pokerVotes: false,
      },
    });

    this.pokerGateway.emitPokerEvent(sessionId, 'pokerSessionClosed', { sessionId });

    return endSession;
  }

  async submitVote(dto: SubmitVoteDto, userId: string) {
    const session = await this.findSessionId(dto.sessionId);

    if (!session) {
      throw new NotFoundException('Poker session not found');
    }

    if (session.pokerStatus !== PokerStatus.VOTING) {
      throw new BadRequestException('Please, wait for voting phase');
    }

    const member = await this.prisma.boardMember.findFirst({
      where: {
        userId,
        board: { pokerSessions: { some: { id: dto.sessionId } } },
      },
    });
    if (!member) {
      throw new NotFoundException('User not found');
    }

    const vote = await this.prisma.pokerVotes.create({
      data: {
        voteValue: dto.value,
        pokerSessionId: session.id,
        boardMemberId: member.userId,
        boardMemberUserId: member.userId,
      },
    });

    this.pokerGateway.emitPokerEvent(session.id, 'pokerVoteSubmitted', {
      sessionId: session.id,
      userId: member.userId,
    });

    return vote;
  }

  async revealVotes(sessionId: string) {
    const session = await this.findSessionId(sessionId);

    if (!session) {
      throw new NotFoundException('Poker session ID not found');
    }

    if (session.pokerStatus !== PokerStatus.VOTING) {
      throw new BadRequestException('Please wait for the next round');
    }
    const revealed = await this.prisma.pokerSession.update({
      where: {
        id: sessionId,
      },
      data: {
        pokerStatus: PokerStatus.REVEALED,
      },
      include: {
        pokerVotes: true,
      },
    });

    this.pokerGateway.emitPokerEvent(sessionId, 'pokerVotesRevealed', {
      sessionId,
      votes: revealed.pokerVotes,
    });

    return revealed;
  }

  async nextCard(sessionId: string) {
    const session = await this.findSessionId(sessionId);

    if (!session) {
      throw new NotFoundException('Poker session ID not found');
    }

    if (session.pokerStatus !== PokerStatus.REVEALED) {
      throw new BadRequestException('Session status must be REVEALED');
    }

    const hideCard = await this.prisma.pokerSession.update({
      where: {
        id: sessionId,
      },
      data: {
        pokerStatus: PokerStatus.VOTING,
      },
      include: {
        pokerVotes: true,
      },
    });

    this.pokerGateway.emitPokerEvent(sessionId, 'pokerNextCard', {
      sessionId,
    });

    return hideCard;
  }

  async startSession(sessionId: string) {
    const session = await this.findSessionId(sessionId);

    if (!session) {
      throw new NotFoundException('Poker session ID not found');
    }

    if (session.pokerStatus !== PokerStatus.WAITING) {
      throw new BadRequestException('Session must be WAITING');
    }

    const started = await this.prisma.pokerSession.update({
      where: { id: sessionId },
      data: { pokerStatus: PokerStatus.VOTING },
    });

    this.pokerGateway.emitPokerEvent(sessionId, 'pokerNextCard', {
      sessionId,
    });

    return started;
  }

  private async findSessionId(sessionId: string) {
    const session = await this.prisma.pokerSession.findUnique({
      where: {
        id: sessionId,
      },
    });
    return session;
  }
}