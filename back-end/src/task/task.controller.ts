import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
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

import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskOtherListDto } from './dto/move-task-other-list.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';

@ApiCookieAuth()
@ApiTags('Tarefas')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'tasks', version: '1' })
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @ApiOperation({
    summary: 'Cria uma nova tarefa',
    description: 'Cria uma nova tarefa para o usuário autenticado',
  })
  @ApiResponse({ status: 201, description: 'Tarefa criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao criar a tarefa' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Post()
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN, Role.MEMBER)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTaskDto) {
    return this.taskService.create(user.id, dto);
  }

  @ApiOperation({
    summary: 'Busca todas as tarefas de uma lista',
    description:
      'Busca todas as tarefas de uma lista específica do usuário autenticado',
  })
  @ApiResponse({ status: 200, description: 'Tarefas encontradas com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao buscar as tarefas' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Get('list/:listtaskId')
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN, Role.MEMBER, Role.OBSERVER)
  findAll(@Param('listtaskId') listtaskId: string) {
    return this.taskService.findAllByList(listtaskId);
  }

  @ApiOperation({
    summary: 'Busca uma tarefa específica',
    description: 'Busca uma tarefa específica pelo taskId',
  })
  @ApiResponse({ status: 200, description: 'Tarefa encontrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao buscar a tarefa' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Get(':taskId')
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN, Role.MEMBER, Role.OBSERVER)
  findOne(@Param('taskId') taskId: string) {
    return this.taskService.findOne(taskId);
  }

  @ApiOperation({
    summary: 'Atualiza uma tarefa',
    description: 'Atualiza uma tarefa específica pelo taskId',
  })
  @ApiResponse({ status: 200, description: 'Tarefa atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao atualizar a tarefa' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Patch(':taskId')
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN, Role.MEMBER)
  update(@Param('taskId') taskId: string, @Body() dto: UpdateTaskDto) {
    return this.taskService.update(taskId, dto);
  }

  @ApiOperation({
    summary: 'Atualiza a posição de uma tarefa',
    description: 'Atualiza a posição de uma tarefa específica pelo taskId',
  })
  @ApiResponse({ status: 200, description: 'tarefa atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao atualizar a tarefa' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Patch(':taskId/position')
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN, Role.MEMBER)
  updatePosition(
    @Param('taskId') taskId: string,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.taskService.updatePosition(taskId, dto.newPosition);
  }

  @ApiOperation({
    summary: 'Remove uma tarefa',
    description: 'Remove uma tarefa específica pelo taskId',
  })
  @ApiResponse({ status: 200, description: 'Tarefa removida com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao remover a tarefa' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Delete(':taskId')
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN, Role.MEMBER)
  remove(@Param('taskId') taskId: string) {
    return this.taskService.remove(taskId);
  }

  @ApiOperation({
    summary: 'Busca tarefas vencidas ou com vencimento hoje',
    description:
      'Busca todas as tarefas que estão vencidas ou com vencimento no dia atual do usuário autenticado',
  })
  @ApiResponse({ status: 200, description: 'Tarefas encontradas com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao buscar as tarefas' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Get('due/today')
  @UseGuards(JwtAuthGuard)
  getTodayOrOverdueTasks(@CurrentUser() user: AuthenticatedUser) {
    return this.taskService.findTasksOverdueDate(user.id);
  }

  @ApiOperation({
    summary: 'Move uma tarefa para outra lista',
    description: 'Move uma tarefa específica para uma nova lista',
  })
  @ApiResponse({ status: 200, description: 'Tarefa movida com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao mover a tarefa' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Lista não encontrada' })
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada' })
  @Patch(':taskId/move')
  @UseGuards(JwtAuthGuard, BoardRoleGuard)
  @BoardRoles(Role.ADMIN, Role.MEMBER)
  moveTask(
    @Param('taskId') taskId: string,
    @Body() dto: MoveTaskOtherListDto,
  ) {
    return this.taskService.moveTaskToList(
      taskId,
      dto.newListId,
      dto.newPosition,
    );
  }
}
