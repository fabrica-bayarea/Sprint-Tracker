import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
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
import { ListService } from '@/list/list.service';

import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';

@ApiCookieAuth()
@ApiTags('Listas')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'lists', version: '1' })
export class ListController {
  constructor(private readonly listService: ListService) {}

  @ApiOperation({
    summary: 'Cria uma nova lista',
    description: 'Cria uma nova lista para o usuário autenticado',
  })
  @ApiResponse({ status: 201, description: 'Lista criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao criar a lista' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Post()
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN, Role.MEMBER)
  create(@Body() dto: CreateListDto) {
    return this.listService.create(dto);
  }

  @ApiOperation({
    summary: 'Busca todas as listas de um quadro',
    description:
      'Busca todas as listas de um quadro específico do usuário autenticado',
  })
  @ApiResponse({ status: 200, description: 'Listas encontradas com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao buscar as listas' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Get('board/:boardId')
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN, Role.MEMBER, Role.OBSERVER)
  findAll(@Param('boardId') boardId: string) {
    return this.listService.findAll(boardId);
  }

  @ApiOperation({
    summary: 'Busca uma lista específica',
    description: 'Busca uma lista específica pelo listId',
  })
  @ApiResponse({ status: 200, description: 'Lista encontrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao buscar a lista' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Get(':listId')
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN, Role.MEMBER, Role.OBSERVER)
  findOne(@Param('listId') ListlistId: string) {
    return this.listService.findOne(ListlistId);
  }

  @ApiOperation({
    summary: 'Atualiza uma lista',
    description: 'Atualiza uma lista específica pelo listId',
  })
  @ApiResponse({ status: 200, description: 'Lista atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao atualizar a lista' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Patch(':listId')
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN, Role.MEMBER)
  update(@Param('listId') ListlistId: string, @Body() dto: UpdateListDto) {
    return this.listService.update(ListlistId, dto);
  }

  @ApiOperation({
    summary: 'Atualiza a posição de uma lista',
    description: 'Atualiza a posição de uma lista específica pelo listId',
  })
  @ApiResponse({ status: 200, description: 'Lista atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao atualizar a lista' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Patch(':listId/position')
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN, Role.MEMBER)
  updatePosition(
    @Param('listId') listId: string,
    @Body() dto: { newPosition: number },
  ) {
    return this.listService.updatePosition(listId, dto.newPosition);
  }

  @ApiOperation({
    summary: 'Remove uma lista',
    description: 'Remove uma lista específica pelo listId',
  })
  @ApiResponse({ status: 200, description: 'Lista removida com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao remover a lista' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Delete(':listId')
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN, Role.MEMBER)
  remove(@Param('listId') listId: string) {
    return this.listService.remove(listId);
  }
}
