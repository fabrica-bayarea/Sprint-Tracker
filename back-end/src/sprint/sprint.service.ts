import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LogAction, SprintStatus } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';

import { CloseSprintDto, IncompleteTasksAction } from './dto/close-sprint.dto';
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

  /**
   * Acha a sprint e garante que o usuário é o DONO dela.
   * Com multi-board a sprint é do usuário (ownerId), não de um board —
   * então a permissão de gerenciar é por dono, não por admin de board.
   */
  private async assertSprintOwner(sprintId: string, userId: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
    });
    if (!sprint) throw new NotFoundException('Sprint não encontrada');
    if (sprint.ownerId !== userId) {
      throw new ForbiddenException('Apenas o dono pode gerenciar esta sprint');
    }
    return sprint;
  }

  // Lista as sprints do USUÁRIO (multi-board). boardId no path é ignorado —
  // mantido por compat com a rota /boards/:boardId/sprints.
  async listByBoard(_boardId: string, userId: string) {
    return this.prisma.sprint.findMany({
      where: { ownerId: userId },
      orderBy: [{ startDate: 'desc' }],
      include: {
        _count: { select: { tasks: true } },
      },
    });
  }

  /**
   * Retorna sprints COMPLETED do board, mais recentes primeiro, com as tasks
   * agrupadas em concluídas vs. incompletas e métricas agregadas.
   *
   * Tasks `ARCHIVED` são excluídas (não contam como concluídas nem incompletas).
   * Como o schema atual não rastreia movimentação entre sprints, "incompletas"
   * aqui são tasks que ficaram no sprint fechado sem serem marcadas DONE.
   */
  async getHistory(_boardId: string, userId: string) {
    const sprints = await this.prisma.sprint.findMany({
      where: { ownerId: userId, status: SprintStatus.COMPLETED },
      orderBy: [{ endDate: 'desc' }],
      include: {
        tasks: {
          where: { deletedAt: null, status: { not: 'ARCHIVED' } },
          select: {
            id: true,
            title: true,
            status: true,
            completedAt: true,
            assignee: {
              select: { id: true, name: true, userName: true, email: true },
            },
            // board de origem de cada task (multi-board)
            list: {
              select: {
                id: true,
                title: true,
                board: { select: { id: true, title: true } },
              },
            },
          },
          orderBy: [{ completedAt: 'desc' }, { updatedAt: 'desc' }],
        },
      },
    });

    return sprints.map((sprint) => {
      const completedTasks = sprint.tasks.filter((t) => t.status === 'DONE');
      const incompleteTasks = sprint.tasks.filter((t) => t.status !== 'DONE');
      const total = sprint.tasks.length;
      const completionRate =
        total > 0 ? Math.round((completedTasks.length / total) * 100) : 0;
      const { tasks: _drop, ...rest } = sprint;
      return {
        ...rest,
        completedTasks,
        incompleteTasks,
        stats: {
          total,
          completed: completedTasks.length,
          incomplete: incompleteTasks.length,
          completionRate,
        },
      };
    });
  }

  /**
   * Retorna a sprint ativa do USUÁRIO (1 por dono). boardId no path é
   * ignorado — a sprint é multi-board. Null se não houver.
   */
  async getActive(_boardId: string, userId: string) {
    const sprint = await this.prisma.sprint.findFirst({
      where: { ownerId: userId, status: SprintStatus.ACTIVE },
      include: {
        tasks: {
          where: { deletedAt: null },
          include: {
            assignee: {
              select: { id: true, name: true, userName: true, email: true },
            },
            labels: { include: { label: true } },
            // inclui o board de origem de cada task (multi-board)
            list: {
              select: {
                id: true,
                title: true,
                board: { select: { id: true, title: true } },
              },
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
        // Sprint é do dono (multi-board). Ainda nasce vinculada ao board de
        // criação (boardId), mas pode receber tasks de qualquer board do
        // dono via addTask.
        ownerId: userId,
        boardId,
        name: dto.name,
        goal: dto.goal,
        startDate: start,
        endDate: end,
      },
    });
  }

  async update(sprintId: string, userId: string, dto: UpdateSprintDto) {
    const sprint = await this.assertSprintOwner(sprintId, userId);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.goal !== undefined) data.goal = dto.goal;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);

    if (dto.status !== undefined) {
      // Só pode haver uma sprint ACTIVE por DONO ao mesmo tempo (multi-board).
      if (dto.status === SprintStatus.ACTIVE) {
        const otherActive = await this.prisma.sprint.findFirst({
          where: {
            ownerId: sprint.ownerId,
            status: SprintStatus.ACTIVE,
            NOT: { id: sprintId },
          },
        });
        if (otherActive) {
          throw new BadRequestException(
            'Você já tem uma sprint ativa. Encerre ela antes de ativar outra.',
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
    await this.assertSprintOwner(sprintId, userId);
    // Tasks têm onDelete: SetNull no schema, então ficam apenas órfãs da sprint
    // (continuam no seu board/list).
    return this.prisma.sprint.delete({ where: { id: sprintId } });
  }

  /**
   * Encerra a sprint redistribuindo tasks incompletas conforme decisão do user.
   *
   * Diferente do PATCH genérico, esse endpoint trata tasks órfãs e loga cada
   * movimentação em TaskLog com action TASK_SPRINT_CHANGED, pra responder
   * "essa task veio da sprint X" no histórico futuramente.
   */
  async closeSprint(sprintId: string, userId: string, dto: CloseSprintDto) {
    const sprint = await this.assertSprintOwner(sprintId, userId);

    if (sprint.status === SprintStatus.COMPLETED) {
      throw new BadRequestException('Sprint já está encerrada');
    }

    if (
      dto.incompleteTasksAction === IncompleteTasksAction.MOVE_TO_NEXT &&
      !dto.targetSprintId
    ) {
      throw new BadRequestException(
        'targetSprintId é obrigatório quando incompleteTasksAction=MOVE_TO_NEXT',
      );
    }

    // Valida targetSprintId quando MOVE_TO_NEXT: precisa existir, ser do mesmo
    // board, estar PLANNED, e não ser a própria sprint sendo encerrada.
    if (
      dto.incompleteTasksAction === IncompleteTasksAction.MOVE_TO_NEXT &&
      dto.targetSprintId
    ) {
      if (dto.targetSprintId === sprintId) {
        throw new BadRequestException(
          'targetSprintId não pode ser a própria sprint sendo encerrada',
        );
      }
      const target = await this.prisma.sprint.findUnique({
        where: { id: dto.targetSprintId },
      });
      if (!target) {
        throw new NotFoundException('Sprint de destino não encontrada');
      }
      if (target.ownerId !== sprint.ownerId) {
        throw new BadRequestException(
          'Sprint de destino pertence a outro usuário',
        );
      }
      if (target.status !== SprintStatus.PLANNED) {
        throw new BadRequestException(
          'Sprint de destino precisa estar PLANNED',
        );
      }
    }

    const incompleteTasks = await this.prisma.task.findMany({
      where: {
        sprintId,
        status: { not: 'DONE' },
        deletedAt: null,
      },
      // Inclui o board da task (via list) — com sprint multi-board, o
      // TaskLog de cada task pertence ao board DELA, não ao da sprint.
      select: { id: true, list: { select: { boardId: true } } },
    });
    const incompleteIds = incompleteTasks.map((t) => t.id);

    await this.prisma.$transaction(async (tx) => {
      if (
        incompleteIds.length > 0 &&
        dto.incompleteTasksAction !== IncompleteTasksAction.KEEP
      ) {
        const newSprintId =
          dto.incompleteTasksAction === IncompleteTasksAction.MOVE_TO_NEXT
            ? (dto.targetSprintId ?? null)
            : null;

        await tx.task.updateMany({
          where: { id: { in: incompleteIds } },
          data: { sprintId: newSprintId },
        });

        await tx.taskLog.createMany({
          data: incompleteTasks.map((t) => ({
            taskId: t.id,
            userId,
            boardId: t.list.boardId,
            action: LogAction.TASK_SPRINT_CHANGED,
            metadata: {
              fromSprintId: sprintId,
              toSprintId: newSprintId,
              reason: 'sprint_closed',
              decision: dto.incompleteTasksAction,
            },
          })),
        });
      }

      await tx.sprint.update({
        where: { id: sprintId },
        data: { status: SprintStatus.COMPLETED },
      });
    });

    return {
      sprintId,
      status: SprintStatus.COMPLETED,
      incompleteTaskCount: incompleteIds.length,
      action: dto.incompleteTasksAction,
      targetSprintId: dto.targetSprintId ?? null,
    };
  }

  async addTask(sprintId: string, taskId: string, userId: string) {
    const sprint = await this.assertSprintOwner(sprintId, userId);
    if (sprint.status === SprintStatus.COMPLETED) {
      throw new BadRequestException('Sprint encerrada não aceita tasks novas');
    }
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { list: { select: { board: { select: { ownerId: true } } } } },
    });
    if (!task) throw new NotFoundException('Task não encontrada');
    // Multi-board: aceita task de QUALQUER board que o dono da sprint possui.
    if (task.list.board.ownerId !== sprint.ownerId) {
      throw new BadRequestException(
        'Você só pode adicionar tasks de boards que você é dono',
      );
    }
    return this.prisma.task.update({
      where: { id: taskId },
      data: { sprintId },
    });
  }

  async removeTask(sprintId: string, taskId: string, userId: string) {
    await this.assertSprintOwner(sprintId, userId);
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
