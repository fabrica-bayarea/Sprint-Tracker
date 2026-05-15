import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { CurrentUser } from '@/auth/strategy/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/types/user.interface';

import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { SprintService } from './sprint.service';

@ApiCookieAuth()
@ApiTags('Sprints')
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @ApiOperation({ summary: 'Lista todas as sprints do board' })
  @ApiResponse({ status: 200, description: 'Lista retornada' })
  @Get('boards/:boardId/sprints')
  list(
    @Param('boardId') boardId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sprintService.listByBoard(boardId, user.id);
  }

  @ApiOperation({
    summary: 'Retorna a sprint ativa do board (ou null)',
    description:
      'Inclui as tasks associadas com assignee, labels e info da list',
  })
  @ApiResponse({ status: 200, description: 'Sprint ativa ou null' })
  @Get('boards/:boardId/sprints/active')
  getActive(
    @Param('boardId') boardId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sprintService.getActive(boardId, user.id);
  }

  @ApiOperation({ summary: 'Cria uma sprint no board (admin)' })
  @ApiResponse({ status: 201, description: 'Sprint criada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @Post('boards/:boardId/sprints')
  create(
    @Param('boardId') boardId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSprintDto,
  ) {
    return this.sprintService.create(boardId, user.id, dto);
  }

  @ApiOperation({
    summary: 'Atualiza uma sprint (admin)',
    description: 'Inclui mudança de status (PLANNED/ACTIVE/COMPLETED)',
  })
  @ApiResponse({ status: 200, description: 'Sprint atualizada' })
  @ApiResponse({ status: 400, description: 'Outra sprint já está ativa' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @Patch('sprints/:sprintId')
  update(
    @Param('sprintId') sprintId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.sprintService.update(sprintId, user.id, dto);
  }

  @ApiOperation({ summary: 'Remove uma sprint (admin)' })
  @ApiResponse({ status: 200, description: 'Sprint removida' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @Delete('sprints/:sprintId')
  remove(
    @Param('sprintId') sprintId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sprintService.remove(sprintId, user.id);
  }

  @ApiOperation({ summary: 'Adiciona uma task à sprint' })
  @ApiResponse({ status: 200, description: 'Task adicionada' })
  @ApiResponse({ status: 400, description: 'Task não pertence ao board' })
  @Post('sprints/:sprintId/tasks/:taskId')
  addTask(
    @Param('sprintId') sprintId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sprintService.addTask(sprintId, taskId, user.id);
  }

  @ApiOperation({ summary: 'Remove uma task da sprint' })
  @ApiResponse({ status: 200, description: 'Task removida da sprint' })
  @Delete('sprints/:sprintId/tasks/:taskId')
  removeTask(
    @Param('sprintId') sprintId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sprintService.removeTask(sprintId, taskId, user.id);
  }
}
