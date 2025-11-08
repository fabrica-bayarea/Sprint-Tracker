import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { BoardRoleGuard } from '@/auth/guards/board-role.guard';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { BoardRoles } from '@/auth/strategy/decorators/board-rules.decorator';
import { CurrentUser } from '@/auth/strategy/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/types/user.interface';

import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { InviteBoardDto } from './dto/invite-to-board.dto';
import { ResponseInviteBoardDto } from './dto/response-invite.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@ApiCookieAuth()
@ApiTags('Quadros')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'boards', version: '1' })
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @ApiOperation({
    summary: 'Cria um novo quadro',
    description: 'Cria um novo quadro para o usuário autenticado',
  })
  @ApiResponse({ status: 201, description: 'Quadro criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao criar o quadro' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBoardDto) {
    return this.boardService.create(user.id, dto);
  }

  @ApiOperation({
    summary: 'Busca todos os quadros do usuário autenticado',
    description: 'Busca todos os quadros do usuário autenticado',
  })
  @ApiResponse({ status: 200, description: 'Quadros encontrados com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao buscar os quadros' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.boardService.findAll(user.id);
  }

  @ApiOperation({
    summary: 'Busca um quadro específico',
    description: 'Busca um quadro específico pelo ID',
  })
  @ApiResponse({ status: 200, description: 'Quadro encontrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao buscar o quadro' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Get(':boardId')
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN, Role.MEMBER, Role.OBSERVER)
  findOne(@Param('boardId') boardId: string) {
    return this.boardService.findOne(boardId);
  }

  @ApiOperation({
    summary: 'Atualiza um quadro específico',
    description: 'Atualiza um quadro específico pelo ID',
  })
  @ApiResponse({ status: 204, description: 'Quadro atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao atualizar o quadro' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Patch(':boardId')
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN)
  update(@Param('boardId') boardId: string, @Body() dto: UpdateBoardDto) {
    return this.boardService.update(boardId, dto);
  }

  @ApiOperation({
    summary: 'Remove um quadro específico',
    description: 'Remove um quadro específico pelo ID',
  })
  @ApiResponse({ status: 204, description: 'Quadro removido com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao remover o quadro' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Delete(':boardId')
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN)
  remove(@Param('boardId') boardId: string) {
    return this.boardService.remove(boardId);
  }

  @ApiOperation({
    summary: 'Convida um usuario para um quadro.',
    description: 'Convida um usuario para um quadro específico pelo UserName',
  })
  @ApiResponse({ status: 200, description: 'Usuário convidado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao convidar o usuário' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Post('invite/:boardId')
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN)
  invite(
    @CurrentUser() sender: AuthenticatedUser,
    @Param('boardId') boardId: string,
    @Body() dto: InviteBoardDto,
  ) {
    return this.boardService.invite(boardId, sender.id, dto);
  }

  @ApiOperation({
    summary: 'Responde a um convite para um quadro.',
    description:
      'Aceita ou recusa um convite para um quadro específico pelo ID do convite',
  })
  @ApiResponse({ status: 200, description: 'Convite respondido com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao responder o convite' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Post('invite/:boardId/response')
  @UseGuards(JwtAuthGuard)
  responseInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('boardId') boardId: string,
    @Body() dto: ResponseInviteBoardDto,
  ) {
    return this.boardService.responseInvite(boardId, user.id, dto);
  }
}
