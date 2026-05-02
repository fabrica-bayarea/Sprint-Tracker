import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { TaskStatus } from '@/common/enums/task-status.enum';
import { BoardGateway } from '@/events/board.gateway';
import { PrismaQueries } from '@/prisma/queries';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTaskDto } from '@/task/dto/create-task.dto';
import { UpdateTaskDto } from '@/task/dto/update-task.dto';
import { TaskService } from '@/task/task.service';
import { TaskLogService } from '@/task-log/task-log.service';

import {
  mockPrisma,
  mockPrismaQueries,
  mockBoardGateway,
  mockTaskLogService,
} from '../setup-mock';

const userId = 'user-123';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(async () => {
    mockPrisma.task.count.mockResolvedValue(0);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PrismaQueries, useValue: mockPrismaQueries },
        { provide: BoardGateway, useValue: mockBoardGateway },
        { provide: TaskLogService, useValue: mockTaskLogService },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task with correct data', async () => {
      const dto: CreateTaskDto = {
        title: 'Tarefa Teste',
        listId: 'list-1',
        status: TaskStatus.TODO,
      };

      const createdTask = {
        id: 'task-1',
        ...dto,
        creatorId: userId,
        description: undefined,
        dueDate: undefined,
        position: 0,
      };

      mockPrisma.list.findUnique.mockResolvedValue({
        id: 'list-1',
        boardId: 'board-1',
      });
      mockPrisma.task.count.mockResolvedValue(0);
      mockPrisma.task.create.mockResolvedValue(createdTask);

      const result = await service.create(userId, dto);

      expect(mockPrisma.list.findUnique).toHaveBeenCalledWith({
        where: { id: dto.listId },
        select: { boardId: true },
      });

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          creatorId: userId,
          listId: dto.listId,
          title: dto.title,
          status: dto.status,
          assigneeId: null,
        }),
      });
      expect(result).toEqual(createdTask);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const id = 'task-1';
      const task = { id, title: 'Teste' };

      mockPrisma.task.findFirst.mockResolvedValue(task);

      const result = await service.findOne(id);

      expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
        where: { id, deletedAt: null },
      });
      expect(result).toEqual(task);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne('not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a task if it exists', async () => {
      const id = 'task-1';
      const dto: UpdateTaskDto = { title: 'Atualizada' };
      const existingTask = {
        id,
        title: 'Original',
        listId: 'list-1',
        status: TaskStatus.TODO,
      };
      const updatedTask = {
        id,
        title: 'Atualizada',
        list: { boardId: 'board-1' },
      };

      mockPrisma.task.findFirst.mockResolvedValue(existingTask);
      mockPrisma.list.findUnique.mockResolvedValue({
        id: 'list-1',
        boardId: 'board-1',
      });
      mockPrisma.task.update.mockResolvedValue(updatedTask);

      const result = await service.update(id, userId, dto);

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id },
        data: expect.any(Object),
        include: { list: { select: { boardId: true } } },
      });
      expect(result).toEqual({ id, title: 'Atualizada' });
    });
  });

  describe('remove', () => {
    it('must soft-delete a task and adjust the position of the others', async () => {
      const taskId = 'task-1';
      const taskToDelete = {
        id: taskId,
        listId: 'list-123',
        position: 2,
      };

      mockPrisma.task.findFirst.mockResolvedValue(taskToDelete);
      mockPrisma.list.findUnique.mockResolvedValue({
        id: 'list-123',
        boardId: 'board-1',
      });

      mockPrisma.$transaction = jest
        .fn()
        .mockImplementation((operations: unknown) => {
          return Promise.resolve(operations);
        });

      await service.remove(taskId, userId);

      expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, deletedAt: null },
      });

      expect(mockPrisma.list.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-123' },
        select: { boardId: true },
      });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if the task does not exist', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);

      await expect(service.remove('not-found', userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePosition', () => {
    const taskId = 'task-move';

    it('should move a task up and increment positions of tasks between old and new position', async () => {
      const oldPosition = 3;
      const newPosition = 1;

      mockPrisma.task.findFirst.mockResolvedValue({
        id: taskId,
        listId: 'list-1',
        position: oldPosition,
      });
      mockPrisma.list.findUnique.mockResolvedValue({
        id: 'list-1',
        boardId: 'board-1',
      });
      mockPrisma.task.update.mockResolvedValue({
        id: taskId,
        position: newPosition,
      });

      await service.updatePosition(taskId, newPosition);

      expect(mockPrisma.task.updateMany).toHaveBeenCalledWith({
        where: {
          listId: 'list-1',
          position: { gte: newPosition, lt: oldPosition },
          deletedAt: null,
        },
        data: {
          position: { increment: 1 },
        },
      });

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { position: newPosition },
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);
      await expect(service.updatePosition(taskId, 5)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findTasksOverdueDate', () => {
    it('should return overdue/near-due tasks for the user', async () => {
      const userIdLocal = 'user-overdue';

      mockPrisma.board.findMany.mockResolvedValue([]);
      const mockTasks = [
        { id: 'task-overdue', dueDate: new Date('2025-10-27') },
      ];
      mockPrisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.findTasksOverdueDate(userIdLocal);

      expect(mockPrisma.task.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockTasks);
    });
  });

  describe('moveTaskToList', () => {
    const taskId = 'task-move-1';
    const oldListId = 'list-old';
    const newListId = 'list-new';
    const newPosition = 2;
    const taskToMove = { id: taskId, listId: oldListId, position: 5 };
    const updatedTask = {
      id: taskId,
      listId: newListId,
      position: newPosition,
    };

    beforeEach(() => {
      mockPrisma.$transaction = jest.fn().mockImplementation((arg: unknown) => {
        if (typeof arg === 'function') {
          return (arg as (prisma: typeof mockPrisma) => unknown)(mockPrisma);
        }
        return Promise.resolve(arg);
      });
      mockPrisma.task.findFirst.mockResolvedValue(taskToMove);
      mockPrisma.list.findUnique
        .mockResolvedValueOnce({ id: oldListId, boardId: 'board-1' })
        .mockResolvedValueOnce({ id: newListId, boardId: 'board-1' });
      mockPrisma.task.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.task.update.mockResolvedValue(updatedTask);
    });

    it('should execute transaction to move task and adjust positions in both lists', async () => {
      const result = await service.moveTaskToList(
        taskId,
        userId,
        newListId,
        newPosition,
      );

      expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, deletedAt: null },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedTask);
    });

    it('should throw NotFoundException if task is not found', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);
      await expect(
        service.moveTaskToList(taskId, userId, newListId, newPosition),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if target list is not found', async () => {
      mockPrisma.list.findUnique.mockReset();
      mockPrisma.list.findUnique
        .mockResolvedValueOnce({ id: oldListId, boardId: 'board-1' })
        .mockResolvedValueOnce(null);
      await expect(
        service.moveTaskToList(taskId, userId, newListId, newPosition),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
