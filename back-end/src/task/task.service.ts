import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskLogService } from 'src/task-log/task-log.service';
import { LogAction } from '@prisma/client';
import { endOfDay } from 'date-fns';

@Injectable()
export class TaskService {
  constructor(
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

  async create(userId: string, dto: CreateTaskDto) {
    const count = await this.prisma.task.count({
      where: { listId: dto.listId },
    });

    const newTask = await this.prisma.task.create({
      data: {
        creatorId: userId,
        listId: dto.listId,
        title: dto.title,
        description: dto.description,
        position: count,
        status: dto.status,
        dueDate: dto.dueDate,
      },
    });

    const boardId = await this.getBoardIdFromList(dto.listId);
    await this.taskLogService.createLog({
      taskId: newTask.id,
      userId,
      boardId,
      action: LogAction.TASK_CREATED,
      metadata: { title: newTask.title },
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

    const hasStatusChange = dto.status !== undefined && dto.status !== task.status;

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

  async findTasksOverdueDate(userId: string) {
    const today = new Date();

    return this.prisma.task.findMany({
      where: {
        creatorId: userId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { lte: endOfDay(today) },
        deletedAt: null,
      },
      include: {
        list: { include: { board: true } },
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

    if (!targetList) throw new NotFoundException('Lista de destino não encontrada');

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
