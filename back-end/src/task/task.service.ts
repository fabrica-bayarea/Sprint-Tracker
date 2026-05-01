/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskLogService } from 'src/task-log/task-log.service';
import { PrismaQueries } from 'src/prisma/queries';
import { LogAction } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(
    private readonly prismaQueries: PrismaQueries,
    private readonly prisma: PrismaService,
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
   * Lança ForbiddenException caso contrário.
   */
  private async assertCanAssign(
    userId: string,
    boardId: string,
  ): Promise<void> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        ...this.prismaQueries.boardInclude,
        members: true,
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
   * Lança ForbiddenException caso contrário.
   */
  private async assertAssigneeIsMember(
    assigneeId: string,
    boardId: string,
  ): Promise<void> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        ...this.prismaQueries.boardInclude,
        members: true,
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

  async create(userId: string, dto: CreateTaskDto) {
    const count = await this.prisma.task.count({
      where: { listId: dto.listId },
    });

    const boardId = await this.getBoardIdFromList(dto.listId);

    // Se está atribuindo a alguém, valida permissão e membership
    if (dto.assigneeId) {
      await this.assertCanAssign(userId, boardId);
      await this.assertAssigneeIsMember(dto.assigneeId, boardId);
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
        assigneeId: dto.assigneeId ?? null,
      },
    });

    await this.taskLogService.createLog({
      taskId: newTask.id,
      userId,
      boardId,
      action: LogAction.TASK_CREATED,
      metadata: { title: newTask.title, assigneeId: dto.assigneeId ?? null },
    });

    return newTask;
  }

  findAllByList(listId: string) {
    return this.prisma.task.findMany({
      where: { listId, deletedAt: null },
      orderBy: { position: 'asc' },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, userId: string, dto: UpdateTaskDto) {
    const task = await this.findOne(id);
    const boardId = await this.getBoardIdFromList(task.listId);

    // Se está mudando assignee, valida permissão e membership
    const isChangingAssignee =
      dto.assigneeId !== undefined && dto.assigneeId !== task.assigneeId;
    if (isChangingAssignee) {
      await this.assertCanAssign(userId, boardId);
      if (dto.assigneeId) {
        await this.assertAssigneeIsMember(dto.assigneeId, boardId);
      }
    }

    const hasStatusChange =
      dto.status !== undefined && dto.status !== task.status;

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: dto,
    });

    if (hasStatusChange) {
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

    return updatedTask;
  }

  async updatePosition(id: string, newPosition: number) {
    const task = await this.findOne(id);
    const oldPosition = task.position;

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
  }

  async remove(taskId: string, userId: string) {
    const taskToDelete = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
    });

    if (!taskToDelete) throw new NotFoundException('Task não encontrada');

    const boardId = await this.getBoardIdFromList(taskToDelete.listId);

    await this.prisma.$transaction([
      // Soft delete
      this.prisma.task.update({
        where: { id: taskId },
        data: { deletedAt: new Date() },
      }),
      // Reorder remaining tasks
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
      boardId,
      action: LogAction.TASK_DELETED,
      metadata: { title: taskToDelete.title },
    });
  }

  /**
   * Retorna tarefas atrasadas ou perto de vencer (≤12h) que sejam relevantes para o usuário:
   *  - Tarefas atribuídas a ele OU criadas por ele (escopo "minhas pendências"), OU
   *  - Em boards onde o usuário é OWNER ou ADMIN (escopo "tarefas do meu time atrasadas")
   */
  async findTasksOverdueDate(userId: string) {
    const now = new Date();
    const horizon = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    // Boards onde o user é owner ou admin → vê tudo do board
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

  async moveTaskToList(
    taskId: string,
    userId: string,
    newListId: string,
    newPosition: number,
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
    });

    if (!task) throw new NotFoundException('Task não encontrada');

    const targetList = await this.prisma.list.findUnique({
      where: { id: newListId },
    });

    if (!targetList)
      throw new NotFoundException('Lista de destino não encontrada');

    const boardId = await this.getBoardIdFromList(task.listId);

    const result = await this.prisma.$transaction(async (prisma) => {
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
      boardId,
      action: LogAction.TASK_MOVED,
      metadata: {
        fromListId: task.listId,
        toListId: newListId,
        newPosition,
      },
    });

    return result;
  }
}
