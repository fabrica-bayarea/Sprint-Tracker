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

import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { TaskCommentService } from './task-comment.service';

@ApiCookieAuth()
@ApiTags('Comentários de Tarefa')
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class TaskCommentController {
  constructor(private readonly service: TaskCommentService) {}

  @ApiOperation({ summary: 'Lista comentários de uma tarefa' })
  @ApiResponse({ status: 200 })
  @Get('tasks/:taskId/comments')
  list(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.list(taskId, user.id);
  }

  @ApiOperation({ summary: 'Adiciona um comentário a uma tarefa' })
  @ApiResponse({ status: 201, description: 'Comentário criado' })
  @Post('tasks/:taskId/comments')
  create(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.service.create(taskId, user.id, dto);
  }

  @ApiOperation({ summary: 'Edita um comentário (apenas autor)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Apenas autor pode editar' })
  @Patch('comments/:commentId')
  update(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.service.update(commentId, user.id, dto);
  }

  @ApiOperation({ summary: 'Remove um comentário (autor / admin / owner)' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @Delete('comments/:commentId')
  remove(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.remove(commentId, user.id);
  }
}
