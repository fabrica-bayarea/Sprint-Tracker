import { Injectable, NotFoundException } from '@nestjs/common';
import { Status } from '@prisma/client';
import { endOfDay } from 'date-fns';

import { BoardGateway } from '@/events/board.gateway';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardGateway: BoardGateway,
  ) {}

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
        completedAt:
          String(dto.status) === String(Status.DONE) ? new Date() : null,
      },
    });

    const payload = {
      boardId: list.boardId,
      action: 'created task',
      at: new Date().toISOString(),
    } as const;
    this.boardGateway.emitModifiedInBoard(list.boardId, payload);

    return newTask;
  }

  /**
   * Lista tarefas de uma lista em ordem de posição.
   */
  findAllByList(listId: string) {
    return this.prisma.task.findMany({
      where: { listId },
      orderBy: { position: 'asc' },
    });
  }

  /**
   * Busca uma tarefa pelo ID ou lança erro se não existir.
   */
  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Tarefa não encontrada');
    return task;
  }

  /**
   * Atualiza os dados de uma tarefa e emite evento de atualização.
   */
  async update(id: string, dto: UpdateTaskDto) {
    const task = await this.findOne(id);
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

    const { list: listRelation, ...taskOnly } = updated;
    const boardId = listRelation.boardId;
    const payload = {
      boardId,
      action: 'updated task',
      at: new Date().toISOString(),
    } as const;
    this.boardGateway.emitModifiedInBoard(boardId, payload);

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
        },
        data: {
          position: { increment: 1 },
        },
      });
    } else if (newPosition > oldPosition) {
      await this.prisma.task.updateMany({
        where: {
          listId: task.listId,
          position: { gt: oldPosition, lte: newPosition },
        },
        data: {
          position: { decrement: 1 },
        },
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
   * Remove uma tarefa e reordena as posições subsequentes.
   */
  async remove(taskId: string) {
    const taskToDelete = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!taskToDelete) throw new NotFoundException('Task não encontrada');

    const list = await this.prisma.list.findUnique({
      where: { id: taskToDelete.listId },
      select: { boardId: true },
    });
    if (!list) throw new NotFoundException('Lista não encontrada');

    await this.prisma.$transaction([
      this.prisma.task.delete({
        where: { id: taskId },
      }),
      this.prisma.task.updateMany({
        where: {
          listId: taskToDelete.listId,
          position: {
            gt: taskToDelete.position,
          },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      }),
    ]);

    const payload = {
      boardId: list.boardId,
      action: 'deleted task',
      at: new Date().toISOString(),
    } as const;
    this.boardGateway.emitModifiedInBoard(list.boardId, payload);
  }

  /**
   * Lista tarefas do usuário vencidas até o fim do dia.
   */
  async findTasksOverdueDate(userId: string) {
    const today = new Date();

    return this.prisma.task.findMany({
      where: {
        creatorId: userId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: {
          lte: endOfDay(today),
        },
      },
      include: {
        list: {
          include: {
            board: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });
  }

  /**
   * Move a tarefa para outra lista e ajusta as posições.
   */
  async moveTaskToList(taskId: string, newListId: string, newPosition: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task não encontrada');
    }

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
          position: {
            gt: task.position,
          },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      });

      await prisma.task.updateMany({
        where: {
          listId: newListId,
          position: {
            gte: newPosition,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
          listId: newListId,
          position: newPosition,
        },
      });

      return updatedTask;
    });

    this.boardGateway.emitModifiedInBoard(sourceList.boardId, {
      boardId: sourceList.boardId,
      action: 'moved task between lists',
      at: new Date().toISOString(),
    });

    return updatedTask;
  }
}
