import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from 'src/task/task.service';
import { PrismaService } from 'src/prisma/prisma.service';
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
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: PrismaService, useValue: mockPrisma },
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
    it('should return all tasks for a list ordered by position', async () => {
      const listId = 'list-1';
      const tasks = [
        { id: 'task-1', position: 1 },
        { id: 'task-2', position: 2 },
      ];

      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const result = await service.findAllByList(listId);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: { listId },
        orderBy: { position: 'asc' },
      });
      expect(result).toEqual(tasks);
    });
  });

  describe('findOne', () => {
    it('should return a task by id', async () => {
      const id = 'task-1';
      const task = { id, title: 'Teste' };

      mockPrisma.task.findUnique.mockResolvedValue(task);

      const result = await service.findOne(id);

      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(task);
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne('not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a task if it exists', async () => {
      const id = 'task-1';
      const dto: UpdateTaskDto = { title: 'Atualizada' };
      const existingTask = { id, title: 'Original' };
      const updatedTask = { id, title: 'Atualizada' };

      mockPrisma.task.findUnique.mockResolvedValue(existingTask);
      mockPrisma.task.update.mockResolvedValue(updatedTask);

      const result = await service.update(id, dto);

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id },
        data: dto,
      });
      expect(result).toEqual(updatedTask);
    });
  });

  it('must remove a task and adjust the position of the others', async () => {
    const taskId = 'task-1';
    const taskToDelete = {
      id: taskId,
      listId: 'list-123',
      position: 2,
    };

    mockPrisma.task.findUnique.mockResolvedValue(taskToDelete);

    const deleteMock = { where: { id: taskId } };
    const updateManyMock = {
      where: {
        listId: taskToDelete.listId,
        position: { gt: taskToDelete.position },
      },
      data: {
        position: { decrement: 1 },
      },
    };

    mockPrisma.task.delete.mockReturnValue(deleteMock as unknown);
    mockPrisma.task.updateMany.mockReturnValue(updateManyMock as unknown);

    mockPrisma.$transaction = jest.fn().mockImplementation((operations) => {
      return Promise.resolve(operations);
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await service.remove(taskId);

    expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
      where: { id: taskId },
    });

    expect(mockPrisma.task.delete).toHaveBeenCalledWith({
      where: { id: taskId },
    });

    expect(mockPrisma.task.updateMany).toHaveBeenCalledWith({
      where: {
        listId: taskToDelete.listId,
        position: { gt: taskToDelete.position },
      },
      data: {
        position: { decrement: 1 },
      },
    });

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const operations: unknown[] = mockPrisma.$transaction.mock.calls[0][0];

    expect(operations[0]).toMatchObject({
      where: { id: taskId },
    });

    expect(operations[1]).toMatchObject({
      where: {
        listId: taskToDelete.listId,
        position: { gt: taskToDelete.position },
      },
      data: {
        position: { decrement: 1 },
      },
    });
  });

  it('should throw NotFoundException if the task does not exist', async () => {
    mockPrisma.task.findUnique.mockResolvedValue(null);

    await expect(service.remove('not-found')).rejects.toThrow(
      NotFoundException,
    );
  });
});
