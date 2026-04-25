import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from 'src/task/task.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TaskLogService } from 'src/task-log/task-log.service';
import { NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from 'src/task/dto/create-task.dto';
import { UpdateTaskDto } from 'src/task/dto/update-task.dto';
import { TaskStatus } from 'src/common/enums/task-status.enum';

describe('TaskService', () => {
  let service: TaskService;

  const mockPrisma = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    list: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockTaskLogService = {
    createLog: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: PrismaService, useValue: mockPrisma },
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
      const userId = 'user-123';
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

      mockPrisma.task.count = jest.fn().mockResolvedValue(0);
      mockPrisma.task.create.mockResolvedValue(createdTask);
      mockPrisma.list.findUnique.mockResolvedValue({ boardId: 'board-1' });

      const result = await service.create(userId, dto);

      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: { listId: dto.listId },
      });
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          creatorId: userId,
          listId: dto.listId,
          title: dto.title,
          description: undefined,
          position: 0,
          status: dto.status,
          dueDate: undefined,
        },
      });
      expect(result).toEqual(createdTask);
    });
  });

  describe('findAllByList', () => {
    it('should return all non-deleted tasks for a list ordered by position', async () => {
      const listId = 'list-1';
      const tasks = [
        { id: 'task-1', position: 1 },
        { id: 'task-2', position: 2 },
      ];

      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const result = await service.findAllByList(listId);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: { listId, deletedAt: null },
        orderBy: { position: 'asc' },
      });
      expect(result).toEqual(tasks);
    });
  });

  describe('findOne', () => {
    it('should return a non-deleted task by id', async () => {
      const id = 'task-1';
      const task = { id, title: 'Teste', deletedAt: null };

      mockPrisma.task.findFirst.mockResolvedValue(task);

      const result = await service.findOne(id);

      expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
        where: { id, deletedAt: null },
      });
      expect(result).toEqual(task);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne('not-found')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a task if it exists', async () => {
      const id = 'task-1';
      const userId = 'user-1';
      const dto: UpdateTaskDto = { title: 'Atualizada' };
      const existingTask = { id, title: 'Original', listId: 'list-1', status: 'TODO', deletedAt: null };
      const updatedTask = { id, title: 'Atualizada' };

      mockPrisma.task.findFirst.mockResolvedValue(existingTask);
      mockPrisma.list.findUnique.mockResolvedValue({ boardId: 'board-1' });
      mockPrisma.task.update.mockResolvedValue(updatedTask);

      const result = await service.update(id, userId, dto);

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id },
        data: dto,
      });
      expect(result).toEqual(updatedTask);
    });
  });

  describe('remove', () => {
    it('must soft-delete a task and adjust the position of the others', async () => {
      const taskId = 'task-1';
      const userId = 'user-1';
      const taskToDelete = {
        id: taskId,
        listId: 'list-123',
        position: 2,
        deletedAt: null,
      };

      mockPrisma.task.findFirst.mockResolvedValue(taskToDelete);
      mockPrisma.list.findUnique.mockResolvedValue({ boardId: 'board-1' });

      mockPrisma.$transaction = jest.fn().mockResolvedValue([{}, {}]);

      await service.remove(taskId, userId);

      expect(mockPrisma.task.findFirst).toHaveBeenCalledWith({
        where: { id: taskId, deletedAt: null },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if the task does not exist', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);

      await expect(service.remove('not-found', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
