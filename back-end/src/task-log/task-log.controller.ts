import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { TaskLogService } from './task-log.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from '../auth/strategy/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/types/user.interface';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiCookieAuth()
@ApiTags('Logs de Tarefas')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'task-logs', version: '1' })
export class TaskLogController {
  constructor(private readonly taskLogService: TaskLogService) {}

  @ApiOperation({ summary: 'Lista os logs de uma tarefa (somente admin)' })
  @ApiResponse({ status: 200, description: 'Logs retornados com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  @Get(':taskId')
  getLogs(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.taskLogService.getLogsByTask(taskId, user.id);
  }

  @ApiOperation({ summary: 'Exporta logs de uma tarefa como CSV (somente admin)' })
  @ApiResponse({ status: 200, description: 'CSV gerado com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  @Get(':taskId/export/csv')
  async exportCsv(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const csv = await this.taskLogService.exportLogsCsv(taskId, user.id);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="task-${taskId}-logs.csv"`,
    );
    res.send(csv);
  }
}
