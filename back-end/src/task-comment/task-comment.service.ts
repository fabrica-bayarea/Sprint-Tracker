import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class TaskCommentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Garante que o usuário tem acesso ao board onde a task está. */
  private async assertBoardAccess(taskId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: {
        list: { include: { board: { include: { members: true } } } },
      },
    });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    const board = task.list.board;
    const isOwner = board.ownerId === userId;
    const isMember = board.members.some((m) => m.userId === userId);
    if (!isOwner && !isMember) {
      throw new ForbiddenException('Você não tem acesso a essa tarefa');
    }
    return task;
  }

  async list(taskId: string, userId: string) {
    await this.assertBoardAccess(taskId, userId);
    return this.prisma.taskComment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, userName: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(taskId: string, userId: string, dto: CreateCommentDto) {
    await this.assertBoardAccess(taskId, userId);
    return this.prisma.taskComment.create({
      data: {
        taskId,
        userId,
        content: dto.content.trim(),
      },
      include: {
        user: { select: { id: true, name: true, userName: true, email: true } },
      },
    });
  }

  async update(commentId: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.taskComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'Apenas o autor do comentário pode editá-lo',
      );
    }
    return this.prisma.taskComment.update({
      where: { id: commentId },
      data: { content: dto.content?.trim() ?? comment.content },
      include: {
        user: { select: { id: true, name: true, userName: true, email: true } },
      },
    });
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.prisma.taskComment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            list: { include: { board: { include: { members: true } } } },
          },
        },
      },
    });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    const board = comment.task.list.board;
    const isOwner = board.ownerId === userId;
    const membership = board.members.find((m) => m.userId === userId);
    const isAdmin = membership?.role === 'ADMIN';
    const isAuthor = comment.userId === userId;
    if (!isAuthor && !isAdmin && !isOwner) {
      throw new ForbiddenException(
        'Apenas o autor, admin ou owner do board podem excluir',
      );
    }
    await this.prisma.taskComment.delete({ where: { id: commentId } });
    return { message: 'Comentário removido' };
  }
}
