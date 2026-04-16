import { Body, Post, Get, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { BacklogService } from './backlog.service';
import { Controller } from '@nestjs/common';
import { CreateBacklogDto } from './dto/create-backlog.dto';
import { ApiResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { ApiOperation } from '@nestjs/swagger/dist/decorators/api-operation.decorator';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/auth/strategy/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/types/user.interface';

@ApiCookieAuth()
@ApiTags('Backlogs')
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'backlogs',
  version: '1',
})
export class BacklogController {
  constructor(private readonly backlogService: BacklogService) {}

  @ApiOperation({
    summary: 'Cria um novo backlog',
    description: 'Cria um novo backlog para um quadro específico',
  })
  @ApiResponse({ status: 201, description: 'Backlog criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao criar o backlog' })
  @ApiResponse({ status: 404, description: 'Quadro não encontrado' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBacklogDto,
  ) {
    return this.backlogService.create(dto);
  }

  @ApiOperation({
    summary: 'Busca todos os backlogs',
    description: 'Busca todos os backlogs disponíveis',
  })
  @ApiResponse({ status: 200, description: 'Backlogs encontrados com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao buscar os backlogs' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Get('findall')
  findAll() {
    return this.backlogService.findAll();
  }

  @ApiOperation({
    summary: 'Busca um backlog específico',
    description: 'Busca um backlog específico pelo ID',
  })
  @ApiResponse({ status: 200, description: 'Backlog encontrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao buscar o backlog' })
  @ApiResponse({ status: 404, description: 'Backlog não encontrado' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.backlogService.findOne(id);
  }

  @ApiOperation({
    summary: 'Atualiza um backlog específico',
    description: 'Atualiza um backlog específico pelo ID',
  })
  @ApiResponse({ status: 200, description: 'Backlog atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao atualizar o backlog' })
  @ApiResponse({ status: 404, description: 'Backlog não encontrado' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Put(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateBacklogDto,
  ) {
    return this.backlogService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Mostra o backlog do Board ID inserido',
    description: 'Mostra o backlog do Board ID inserido',
  })
  @ApiResponse({ status: 200, description: 'Backlog encontrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao buscar o board' })
  @ApiResponse({ status: 404, description: 'Board não encontrado' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Get('board/:id')
  findBacklogByBoardId(@Param('id') id: string) {
    return this.backlogService.findBacklogByBoardId(id);
  }

  @ApiOperation({
    summary: 'Remove um backlog específico',
    description: 'Remove um backlog específico pelo ID',
  })
  @ApiResponse({ status: 200, description: 'Backlog removido com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao remover o backlog' })
  @ApiResponse({ status: 404, description: 'Backlog não encontrado' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.backlogService.remove(id);
  }

  @ApiOperation({
    summary: 'End point de teste',
    description:
      'End point de teste para verificar se o controller está funcionando',
  })
  @ApiResponse({ status: 200, description: 'Pong!' })
  @Get('ping')
  ping() {
    return 'Pong!';
  }
}
