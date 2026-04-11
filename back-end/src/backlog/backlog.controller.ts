import { Body, Post, Get, Param } from '@nestjs/common';
import { BacklogService } from './backlog.service';
import { Controller } from '@nestjs/common';
import { CreateBacklogDto } from './dto/create-backlog.dto';
import { ApiResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator';
import { ApiOperation } from '@nestjs/swagger/dist/decorators/api-operation.decorator';

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
  create(@Body() dto: CreateBacklogDto) {
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

  @Get('ping')
  ping() {
    return 'Pong!';
  }
}
