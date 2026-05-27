import { CurrentUser } from '@/auth/strategy/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/types/user.interface';
import { Body, Controller, UseGuards, Post, Param } from '@nestjs/common';
import { CreatePokerSessionDTO } from './dto/CreateSession.dto';
import { PokerService } from './poker.service';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { SubmitVoteDto } from './dto/SubmitVote.dto';
import { BoardRoleGuard } from '@/auth/guards/board-role.guard';
import { BoardRoles } from '@/auth/strategy/decorators/board-rules.decorator';
import { Role } from '@prisma/client'

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
}
