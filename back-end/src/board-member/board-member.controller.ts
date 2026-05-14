import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/auth/strategy/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/types/user.interface';
import { BoardMemberService } from './board-member.service';
import { AddMemberDto } from './dto/add-member.dto';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiCookieAuth()
@ApiTags('Membros do Board')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'boards/:boardId/members', version: '1' })
export class BoardMemberController {
  constructor(private readonly service: BoardMemberService) {}

  @ApiOperation({ summary: 'Lista membros do board' })
  @ApiResponse({ status: 200, description: 'Lista retornada' })
  @ApiResponse({ status: 403, description: 'Sem acesso ao board' })
  @Get()
  list(
    @Param('boardId') boardId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.list(boardId, user.id);
  }

  @ApiOperation({ summary: 'Adiciona um membro ao board (admin/owner)' })
  @ApiResponse({ status: 201, description: 'Membro adicionado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Board ou usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Usuário já é membro' })
  @Post()
  add(
    @Param('boardId') boardId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddMemberDto,
  ) {
    return this.service.add(boardId, user.id, dto);
  }

  @ApiOperation({ summary: 'Remove um membro do board (admin/owner)' })
  @ApiResponse({ status: 200, description: 'Membro removido' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Membro não encontrado' })
  @Delete(':userId')
  remove(
    @Param('boardId') boardId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.remove(boardId, user.id, targetUserId);
  }
}
