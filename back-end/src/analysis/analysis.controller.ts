import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { CurrentUser } from '@/auth/strategy/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/types/user.interface';

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
  @ApiResponse({
    status: 200,
    description: 'Resumo de tarefas concluídas obtido com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Erro ao obter o resumo' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @UseGuards(JwtAuthGuard)
  @Get('completed/:boardId')
  async getCompletedTasksSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('boardId') boardId: string,
    @Query() query: GetCompletedSummaryDto,
  ) {
    if (!user?.id) {
      throw new HttpException(
        'User not authenticated.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const summary = await this.AnalysisService.getCompletedTasksSummary(
      user.id,
      boardId,
      query,
    );
    return summary;
  }
}
