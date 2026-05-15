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

import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { LabelService } from './label.service';

@ApiCookieAuth()
@ApiTags('Labels')
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class LabelController {
  constructor(private readonly labelService: LabelService) {}

  @ApiOperation({ summary: 'Lista as labels do board' })
  @ApiResponse({ status: 200, description: 'Lista retornada' })
  @Get('boards/:boardId/labels')
  list(
    @Param('boardId') boardId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.labelService.listByBoard(boardId, user.id);
  }

  @ApiOperation({ summary: 'Cria uma label no board (admin)' })
  @ApiResponse({ status: 201, description: 'Label criada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @Post('boards/:boardId/labels')
  create(
    @Param('boardId') boardId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLabelDto,
  ) {
    return this.labelService.create(boardId, user.id, dto);
  }

  @ApiOperation({ summary: 'Atualiza uma label (admin)' })
  @ApiResponse({ status: 200, description: 'Label atualizada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Label não encontrada' })
  @Patch('labels/:labelId')
  update(
    @Param('labelId') labelId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLabelDto,
  ) {
    return this.labelService.update(labelId, user.id, dto);
  }

  @ApiOperation({ summary: 'Remove uma label (admin)' })
  @ApiResponse({ status: 200, description: 'Label removida' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Label não encontrada' })
  @Delete('labels/:labelId')
  remove(
    @Param('labelId') labelId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.labelService.remove(labelId, user.id);
  }

  @ApiOperation({ summary: 'Atribui uma label a uma tarefa' })
  @ApiResponse({ status: 200, description: 'Label atribuída' })
  @Post('tasks/:taskId/labels/:labelId')
  addToTask(
    @Param('taskId') taskId: string,
    @Param('labelId') labelId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.labelService.addToTask(taskId, labelId, user.id);
  }

  @ApiOperation({ summary: 'Remove uma label de uma tarefa' })
  @ApiResponse({ status: 200, description: 'Label removida da tarefa' })
  @Delete('tasks/:taskId/labels/:labelId')
  removeFromTask(
    @Param('taskId') taskId: string,
    @Param('labelId') labelId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.labelService.removeFromTask(taskId, labelId, user.id);
  }
}
