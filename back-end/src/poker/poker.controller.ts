import { Body, Controller, UseGuards, Post, Param } from '@nestjs/common';
import { Role } from '@prisma/client';

import { BoardRoleGuard } from '@/auth/guards/board-role.guard';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { BoardRoles } from '@/auth/strategy/decorators/board-rules.decorator';
import { CurrentUser } from '@/auth/strategy/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/types/user.interface';

import { CreatePokerSessionDTO } from './dto/CreateSession.dto';
import { SubmitVoteDto } from './dto/SubmitVote.dto';
import { PokerService } from './poker.service';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'poker', version: '1' })
export class PokerController {
  constructor(private readonly pokerService: PokerService) {}

  @UseGuards(BoardRoleGuard)
  @BoardRoles(Role.ADMIN)
  @Post('/create/:boardId')
  create(
    @Param('boardId') boardId: string,
    @Body() dto: CreatePokerSessionDTO,
  ) {
    return this.pokerService.createPokerSession(dto, boardId);
  }

  @Post('/join/:inviteCode')
  join(@Param('inviteCode') inviteCode: string) {
    return this.pokerService.joinSession(inviteCode);
  }

  @Post('/vote/:sessionId')
  vote(@Body() dto: SubmitVoteDto, @CurrentUser() user: AuthenticatedUser) {
    return this.pokerService.submitVote(dto, user.id);
  }

  @UseGuards(BoardRoleGuard)
  @Post('/reveal/:sessionId')
  @BoardRoles(Role.ADMIN)
  reveal(@Param('sessionId') sessionId: string) {
    return this.pokerService.revealVotes(sessionId);
  }

  @UseGuards(BoardRoleGuard)
  @Post('/close/:sessionId')
  @BoardRoles(Role.ADMIN)
  close(@Param('sessionId') sessionId: string) {
    return this.pokerService.closeSession(sessionId);
  }

  @Post('/next/:sessionId')
  next(@Param('sessionId') sessionId: string) {
    return this.pokerService.nextCard(sessionId);
  }
}
