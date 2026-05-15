import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';

@Injectable()
export class LabelService {
  constructor(private readonly prisma: PrismaService) {}

  /** Garante que o usuário é admin/owner do board (necessário pra criar/editar/excluir labels). */
  private async assertBoardAdmin(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { members: { where: { userId } } },
    });
    if (!board) throw new NotFoundException('Board não encontrado');
    const isOwner = board.ownerId === userId;
    const isAdmin = board.members[0]?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Apenas administradores podem gerenciar labels do board',
      );
    }
  }

  /** Garante que o usuário tem acesso ao board (qualquer membro). */
  private async assertBoardAccess(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { members: { where: { userId } } },
    });
    if (!board) throw new NotFoundException('Board não encontrado');
    const isOwner = board.ownerId === userId;
    const isMember = board.members.length > 0;
    if (!isOwner && !isMember) {
      throw new ForbiddenException('Você não tem acesso a este board');
    }
  }

  async listByBoard(boardId: string, userId: string) {
    await this.assertBoardAccess(boardId, userId);
    return this.prisma.label.findMany({
      where: { boardId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(boardId: string, userId: string, dto: CreateLabelDto) {
    await this.assertBoardAdmin(boardId, userId);
    return this.prisma.label.create({
      data: { boardId, name: dto.name, color: dto.color },
    });
  }

  async update(labelId: string, userId: string, dto: UpdateLabelDto) {
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
    });
    if (!label) throw new NotFoundException('Label não encontrada');
    await this.assertBoardAdmin(label.boardId, userId);
    return this.prisma.label.update({
      where: { id: labelId },
      data: { ...dto },
    });
  }

  async remove(labelId: string, userId: string) {
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
    });
    if (!label) throw new NotFoundException('Label não encontrada');
    await this.assertBoardAdmin(label.boardId, userId);
    await this.prisma.taskLabel.deleteMany({ where: { labelId } });
    return this.prisma.label.delete({ where: { id: labelId } });
  }

  /** Atribui uma label a uma task (idempotente). */
  async addToTask(taskId: string, labelId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: { list: true },
    });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
    });
    if (!label) throw new NotFoundException('Label não encontrada');
    if (label.boardId !== task.list.boardId) {
      throw new ForbiddenException(
        'A label pertence a outro board',
      );
    }
    await this.assertBoardAccess(label.boardId, userId);

    await this.prisma.taskLabel.upsert({
      where: { taskId_labelId: { taskId, labelId } },
      update: {},
      create: { taskId, labelId },
    });
    return { message: 'Label atribuída à tarefa' };
  }

  async removeFromTask(taskId: string, labelId: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      include: { list: true },
    });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    await this.assertBoardAccess(task.list.boardId, userId);
    await this.prisma.taskLabel.deleteMany({
      where: { taskId, labelId },
    });
    return { message: 'Label removida da tarefa' };
  }
}
