import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';
import { CreatePokerSessionDTO } from './dto/CreateSession.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { PokerStatus } from '@prisma/client';
import { SubmitVoteDto } from './dto/SubmitVote.dto';

@Injectable()
export class PokerService {
  constructor(private readonly prisma: PrismaService) {}

  async CreatePokerSession(dto: CreatePokerSessionDTO, boardId: string) {
    const inviteCode = nanoid(6);
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
    const findingInvinteCode = await this.prisma.pokerSession.findUnique({
      where: { inviteCode },
    });
    if (!findingInvinteCode) {
      throw new NotFoundException('Invalid invite code');
    }
    if (findingInvinteCode.pokerStatus === PokerStatus.CLOSED) {
      throw new BadRequestException('Poker session is closed');
    }
    return findingInvinteCode;
  }

  async submitVote(dto: SubmitVoteDto, userId: string) {
    const session = await this.prisma.pokerSession.findUnique({
      where: {
        id: dto.sessionId,
      },
    });

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
}
