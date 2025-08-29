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
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from '../auth/strategy/decorators/current-user.decorator';
import {
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from 'src/types/user.interface';
import { UpdatePositionDto } from './dto/update-position.dto';
import { MoveTaskOtherListDto } from './dto/move-task-other-list.dto';

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
  @Get('list/:listId')
  findAll(@Param('listId') listId: string) {
    return this.taskService.findAllByList(listId);
  }

  @ApiOperation({
    summary: 'Busca uma tarefa específica',
    description: 'Busca uma tarefa específica pelo ID',
  })
  @ApiResponse({ status: 200, description: 'Tarefa encontrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao buscar a tarefa' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  @ApiOperation({
    summary: 'Atualiza uma tarefa',
    description: 'Atualiza uma tarefa específica pelo ID',
  })
  @ApiResponse({ status: 200, description: 'Tarefa atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao atualizar a tarefa' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.taskService.update(id, dto);
  }

  @ApiOperation({
    summary: 'Atualiza a posição de uma tarefa',
    description: 'Atualiza a posição de uma tarefa específica pelo ID',
  })
  @ApiResponse({ status: 200, description: 'tarefa atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao atualizar a tarefa' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Patch(':id/position')
  updatePosition(
    @Param('id') id: string,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.taskService.updatePosition(id, dto.newPosition);
  }

  @ApiOperation({
    summary: 'Remove uma tarefa',
    description: 'Remove uma tarefa específica pelo ID',
  })
  @ApiResponse({ status: 200, description: 'Tarefa removida com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao remover a tarefa' })
  @ApiResponse({ status: 401, description: 'Usuário não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(id);
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
  @Patch(':id/move')
  moveTask(@Param('id') taskId: string, @Body() dto: MoveTaskOtherListDto) {
    return this.taskService.moveTaskToList(taskId, dto.newListId, dto.newPosition);
  }
}
