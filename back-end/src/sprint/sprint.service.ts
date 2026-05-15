import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SprintStatus } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';

@Injectable()
export class SprintService {
  constructor(private readonly prisma: PrismaService) {}

  /** Garante que o usuário é admin/owner do board. */
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
        'Apenas administradores podem gerenciar sprints',
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

  /** Acha a sprint, valida acesso e retorna sprint + boardId. */
  private async assertSprintAccess(sprintId: string, userId: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
    });
    if (!sprint) throw new NotFoundException('Sprint não encontrada');
    await this.assertBoardAccess(sprint.boardId, userId);
    return sprint;
  }

  async listByBoard(boardId: string, userId: string) {
    await this.assertBoardAccess(boardId, userId);
    return this.prisma.sprint.findMany({
      where: { boardId },
      orderBy: [{ startDate: 'desc' }],
      include: {
        _count: { select: { tasks: true } },
      },
    });
  }

  /** Retorna a sprint ativa (status=ACTIVE) com tasks completas. Null se não houver. */
  async getActive(boardId: string, userId: string) {
    await this.assertBoardAccess(boardId, userId);
    const sprint = await this.prisma.sprint.findFirst({
      where: { boardId, status: SprintStatus.ACTIVE },
      include: {
        tasks: {
          where: { deletedAt: null },
          include: {
            assignee: {
              select: { id: true, name: true, userName: true, email: true },
            },
            labels: { include: { label: true } },
            list: {
              select: { id: true, title: true },
            },
          },
          orderBy: [{ updatedAt: 'desc' }],
        },
      },
    });
    return sprint;
  }

  async create(boardId: string, userId: string, dto: CreateSprintDto) {
    await this.assertBoardAdmin(boardId, userId);
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start >= end) {
      throw new BadRequestException('A data de fim deve ser depois do início');
    }
    return this.prisma.sprint.create({
      data: {
        boardId,
        name: dto.name,
        goal: dto.goal,
        startDate: start,
        endDate: end,
      },
    });
  }

  async update(sprintId: string, userId: string, dto: UpdateSprintDto) {
    const sprint = await this.assertSprintAccess(sprintId, userId);
    await this.assertBoardAdmin(sprint.boardId, userId);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.goal !== undefined) data.goal = dto.goal;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);

    if (dto.status !== undefined) {
      // Só pode haver uma sprint ACTIVE por board ao mesmo tempo.
      if (dto.status === SprintStatus.ACTIVE) {
        const otherActive = await this.prisma.sprint.findFirst({
          where: {
            boardId: sprint.boardId,
            status: SprintStatus.ACTIVE,
            NOT: { id: sprintId },
          },
        });
        if (otherActive) {
          throw new BadRequestException(
            'Já existe uma sprint ativa neste board. Feche ela antes de ativar outra.',
          );
        }
      }
      data.status = dto.status;
    }

    if (data.startDate && data.endDate) {
      if ((data.startDate as Date) >= (data.endDate as Date)) {
        throw new BadRequestException(
          'A data de fim deve ser depois do início',
        );
      }
    }

    return this.prisma.sprint.update({
      where: { id: sprintId },
      data,
    });
  }

  async remove(sprintId: string, userId: string) {
    const sprint = await this.assertSprintAccess(sprintId, userId);
    await this.assertBoardAdmin(sprint.boardId, userId);
    // Tasks têm onDelete: SetNull no schema, então ficam apenas órfãs da sprint
    // (continuam no seu board/list).
    return this.prisma.sprint.delete({ where: { id: sprintId } });
  }

  async addTask(sprintId: string, taskId: string, userId: string) {
    const sprint = await this.assertSprintAccess(sprintId, userId);
    if (sprint.status === SprintStatus.COMPLETED) {
      throw new BadRequestException('Sprint encerrada não aceita tasks novas');
    }
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { list: { select: { boardId: true } } },
    });
    if (!task) throw new NotFoundException('Task não encontrada');
    if (task.list.boardId !== sprint.boardId) {
      throw new BadRequestException('Task pertence a outro board');
    }
    return this.prisma.task.update({
      where: { id: taskId },
      data: { sprintId },
    });
  }

  async removeTask(sprintId: string, taskId: string, userId: string) {
    await this.assertSprintAccess(sprintId, userId);
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task não encontrada');
    if (task.sprintId !== sprintId) {
      throw new BadRequestException('Task não está nesta sprint');
    }
    return this.prisma.task.update({
      where: { id: taskId },
      data: { sprintId: null },
    });
  }
}
