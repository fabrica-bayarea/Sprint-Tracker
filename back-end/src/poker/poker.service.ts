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

@Injectable()
export class PokerService {
  constructor(private readonly prisma: PrismaService) {}

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
        ...dto,
        boardId,
        pokerStatus: PokerStatus.WAITING,
        inviteCode,
      },
    });
    return pokerSession;
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
    return hideCard;
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
