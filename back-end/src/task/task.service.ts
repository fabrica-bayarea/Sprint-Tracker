import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LogAction, SprintStatus, Status } from '@prisma/client';

import { BoardGateway } from '@/events/board.gateway';
import { PrismaQueries } from '@/prisma/queries';
import { PrismaService } from '@/prisma/prisma.service';
import { TaskLogService } from '@/task-log/task-log.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaQueries: PrismaQueries,
    private readonly boardGateway: BoardGateway,
    private readonly taskLogService: TaskLogService,
  ) {}

  private async getBoardIdFromList(listId: string): Promise<string> {
    const list = await this.prisma.list.findUnique({
      where: { id: listId },
      select: { boardId: true },
    });
    if (!list) throw new NotFoundException('Lista não encontrada');
    return list.boardId;
  }

  /**
   * Verifica se o usuário pode atribuir tarefas no board (owner ou admin).
   */
  private async assertCanAssign(
    userId: string,
    boardId: string,
  ): Promise<void> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        ...this.prismaQueries.boardInclude,
        members: { where: { userId } },
      },
    });
    if (!board) throw new NotFoundException('Board não encontrado');

    const isOwner = board.ownerId === userId;
    const isAdmin = board.members[0]?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Apenas administradores podem atribuir tarefas neste board.',
      );
    }
  }

  /**
   * Verifica se o assignee é membro (ou owner) do board.
   */
  private async assertAssigneeIsMember(
    assigneeId: string,
    boardId: string,
  ): Promise<void> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: { where: { userId: assigneeId } },
      },
    });
    if (!board) throw new NotFoundException('Board não encontrado');

    const isOwner = board.ownerId === assigneeId;
    const isMember = board.members.length > 0;

    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        'O usuário atribuído precisa ser membro do board.',
      );
    }
  }

  /**
   * Cria uma nova tarefa na lista e emite evento de criação.
   */
  async create(userId: string, dto: CreateTaskDto) {
    const list = await this.prisma.list.findUnique({
      where: { id: dto.listId },
      select: { boardId: true },
    });

    if (!list) throw new NotFoundException('Lista não encontrada');

    const count = await this.prisma.task.count({
      where: { listId: dto.listId, deletedAt: null },
    });

    const boardId = list.boardId;

    const normalizedAssignee =
      dto.assigneeId === undefined ? null : dto.assigneeId || null;

    if (normalizedAssignee) {
      await this.assertCanAssign(userId, boardId);
      await this.assertAssigneeIsMember(normalizedAssignee, boardId);
    }

    const normalizedSprint =
      dto.sprintId === undefined ? null : dto.sprintId || null;

    if (normalizedSprint) {
      const sprint = await this.prisma.sprint.findUnique({
        where: { id: normalizedSprint },
        select: { boardId: true, status: true },
      });
      if (!sprint) throw new NotFoundException('Sprint não encontrada');
      if (sprint.boardId !== boardId) {
        throw new BadRequestException('Sprint é de outro board');
      }
      if (sprint.status === SprintStatus.COMPLETED) {
        throw new BadRequestException(
          'Sprint encerrada não aceita tasks novas',
        );
      }
    }

    const newTask = await this.prisma.task.create({
      data: {
        creatorId: userId,
        listId: dto.listId,
        title: dto.title,
        description: dto.description,
        position: count,
        status: dto.status,
        dueDate: dto.dueDate,
        assigneeId: normalizedAssignee,
        sprintId: normalizedSprint,
        completedAt:
          String(dto.status) === String(Status.DONE) ? new Date() : null,
      },
    });

    await this.taskLogService.createLog({
      taskId: newTask.id,
      userId,
      boardId,
      action: LogAction.TASK_CREATED,
      metadata: { title: newTask.title, assigneeId: normalizedAssignee },
    });

    const payload = {
      boardId,
      action: 'created task',
      at: new Date().toISOString(),
    } as const;
    this.boardGateway.emitModifiedInBoard(boardId, payload);

    return newTask;
  }

  findAllByList(listId: string) {
    return this.prisma.task.findMany({
      where: { listId, deletedAt: null },
      orderBy: { position: 'asc' },
    });
  }

  /**
   * Busca uma tarefa pelo ID ou lança erro se não existir.
   */
  async findOne(id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
    });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    return task;
  }

  /**
   * Atualiza os dados de uma tarefa e emite evento de atualização.
   */
  async update(id: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.findOne(id);
    const boardId = await this.getBoardIdFromList(task.listId);

    const isChangingAssignee =
      dto.assigneeId !== undefined && dto.assigneeId !== task.assigneeId;
    if (isChangingAssignee) {
      await this.assertCanAssign(userId, boardId);
      if (dto.assigneeId) {
        await this.assertAssigneeIsMember(dto.assigneeId, boardId);
      }
    }

    let completedAt: Date | null | undefined = undefined;
    const isStatusChanging =
      dto.status != null && String(dto.status) !== String(task.status);

    if (isStatusChanging) {
      if (
        String(dto.status) === String(Status.DONE) &&
        task.status !== Status.DONE
      ) {
        completedAt = new Date();
      } else if (
        String(dto.status) !== String(Status.DONE) &&
        task.status === Status.DONE
      ) {
        completedAt = null;
      }
    }

    const dataToUpdate = {
      ...dto,
      ...(completedAt !== undefined && { completedAt }),
    };

    const updated = await this.prisma.task.update({
      where: { id },
      data: dataToUpdate,
      include: { list: { select: { boardId: true } } },
    });

    if (isStatusChanging) {
      await this.taskLogService.createLog({
        taskId: id,
        userId,
        boardId,
        action: LogAction.TASK_STATUS_CHANGED,
        metadata: { from: task.status, to: dto.status },
      });
    } else {
      await this.taskLogService.createLog({
        taskId: id,
        userId,
        boardId,
        action: LogAction.TASK_UPDATED,
        metadata: { changes: dto as Record<string, unknown> },
      });
    }

    const { list: listRelation, ...taskOnly } = updated;
    const payload = {
      boardId: listRelation.boardId,
      action: 'updated task',
      at: new Date().toISOString(),
    } as const;
    this.boardGateway.emitModifiedInBoard(listRelation.boardId, payload);

    return taskOnly;
  }

  /**
   * Atualiza a posição de uma tarefa na lista e reordena as demais.
   */
  async updatePosition(id: string, newPosition: number) {
    const task = await this.findOne(id);
    const oldPosition = task.position;

    const list = await this.prisma.list.findUnique({
      where: { id: task.listId },
      select: { boardId: true },
    });
    if (!list) throw new NotFoundException('Lista não encontrada');

    if (newPosition < oldPosition) {
      await this.prisma.task.updateMany({
        where: {
          listId: task.listId,
          position: { gte: newPosition, lt: oldPosition },
          deletedAt: null,
        },
        data: { position: { increment: 1 } },
      });
    } else if (newPosition > oldPosition) {
      await this.prisma.task.updateMany({
        where: {
          listId: task.listId,
          position: { gt: oldPosition, lte: newPosition },
          deletedAt: null,
        },
        data: { position: { decrement: 1 } },
      });
    }

    await this.prisma.task.update({
      where: { id },
      data: { position: newPosition },
    });

    const payload = {
      boardId: list.boardId,
      action: 'updated task position',
      at: new Date().toISOString(),
    } as const;
    this.boardGateway.emitModifiedInBoard(list.boardId, payload);
  }

  /**
   * Soft-delete de uma tarefa, reordena as posições subsequentes e emite evento.
   */
  async remove(taskId: string, userId: string) {
    const taskToDelete = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
    });

    if (!taskToDelete) throw new NotFoundException('Tarefa não encontrada');

    const list = await this.prisma.list.findUnique({
      where: { id: taskToDelete.listId },
      select: { boardId: true },
    });
    if (!list) throw new NotFoundException('Lista não encontrada');

    await this.prisma.$transaction([
      this.prisma.task.update({
        where: { id: taskId },
        data: { deletedAt: new Date() },
      }),
      this.prisma.task.updateMany({
        where: {
          listId: taskToDelete.listId,
          position: { gt: taskToDelete.position },
          deletedAt: null,
        },
        data: { position: { decrement: 1 } },
      }),
    ]);

    await this.taskLogService.createLog({
      taskId,
      userId,
      boardId: list.boardId,
      action: LogAction.TASK_DELETED,
      metadata: { title: taskToDelete.title },
    });

    const payload = {
      boardId: list.boardId,
      action: 'deleted task',
      at: new Date().toISOString(),
    } as const;
    this.boardGateway.emitModifiedInBoard(list.boardId, payload);
  }

  /**
   * Retorna tarefas atrasadas ou perto de vencer (≤12h) relevantes ao usuário.
   */
  async findTasksOverdueDate(userId: string) {
    const now = new Date();
    const horizon = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const adminBoards = await this.prisma.board.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId, role: 'ADMIN' } } },
        ],
      },
      select: { id: true },
    });
    const adminBoardIds = adminBoards.map((b) => b.id);

    return this.prisma.task.findMany({
      where: {
        status: { in: ['TODO', 'IN_PROGRESS'] },
        deletedAt: null,
        dueDate: { not: null, lte: horizon },
        OR: [
          { creatorId: userId },
          { assigneeId: userId },
          adminBoardIds.length > 0
            ? { list: { boardId: { in: adminBoardIds } } }
            : { id: '__never__' },
        ],
      },
      include: {
        list: { include: { board: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Move a tarefa para outra lista e ajusta as posições.
   */
  async moveTaskToList(
    taskId: string,
    userId: string,
    newListId: string,
    newPosition: number,
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
    });

    if (!task) throw new NotFoundException('Tarefa não encontrada');

    const [sourceList, targetList] = await Promise.all([
      this.prisma.list.findUnique({ where: { id: task.listId } }),
      this.prisma.list.findUnique({ where: { id: newListId } }),
    ]);

    if (!targetList) {
      throw new NotFoundException('Lista de destino não encontrada');
    }
    if (!sourceList) {
      throw new NotFoundException('Lista de origem não encontrada');
    }

    const updatedTask = await this.prisma.$transaction(async (prisma) => {
      await prisma.task.updateMany({
        where: {
          listId: task.listId,
          position: { gt: task.position },
          deletedAt: null,
        },
        data: { position: { decrement: 1 } },
      });

      await prisma.task.updateMany({
        where: {
          listId: newListId,
          position: { gte: newPosition },
          deletedAt: null,
        },
        data: { position: { increment: 1 } },
      });

      return prisma.task.update({
        where: { id: taskId },
        data: { listId: newListId, position: newPosition },
      });
    });

    await this.taskLogService.createLog({
      taskId,
      userId,
      boardId: sourceList.boardId,
      action: LogAction.TASK_MOVED,
      metadata: {
        fromListId: task.listId,
        toListId: newListId,
        newPosition,
      },
    });

    this.boardGateway.emitModifiedInBoard(sourceList.boardId, {
      boardId: sourceList.boardId,
      action: 'moved task between lists',
      at: new Date().toISOString(),
    });

    return updatedTask;
  }
}
