import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { BoardRoleGuard } from '@/auth/guards/board-role.guard';
import { BoardRoles } from '@/auth/strategy/decorators/board-rules.decorator';

import { AnalysisService } from './analysis.service';
import { GetCompletedSummaryDto } from './dto/get-completed-summary.dto';

@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'analysis', version: '1' })
export class AnalysisController {
  constructor(private readonly AnalysisService: AnalysisService) {}
  @ApiOperation({
    summary: 'Resumo de tarefas concluídas',
    description:
      'Obtém um resumo das tarefas concluídas em um período específico, com filtros opcionais',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Data inicial do período (formato ISO 8601)',
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'Data final do período (formato ISO 8601)',
    example: '2025-12-31',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'UUID do usuário para filtrar tarefas',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumo de tarefas concluídas obtido com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Erro ao obter o resumo' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN, Role.MEMBER, Role.OBSERVER)
  @Get('completed/:boardId')
  async getCompletedTasksSummary(
    @Param('boardId') boardId: string,
    @Query() query: GetCompletedSummaryDto,
  ) {
    return await this.AnalysisService.getCompletedTasksSummary(
      boardId,
      query,
    );
  }
}
