import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from 'src/task/task.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from 'src/task/dto/create-task.dto';
import { UpdateTaskDto } from 'src/task/dto/update-task.dto';
import { TaskStatus } from 'src/common/enums/task-status.enum';
import { endOfDay } from 'date-fns';

describe('TaskService', () => {
  let service: TaskService;

  jest.mock('date-fns', () => ({
    endOfDay: jest.fn((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)),
  }));

  interface MockPrismaService {
  list: {
    findUnique: jest.Mock<any, any>;
  };
  task: {
    create: jest.Mock<any, any>;
    findMany: jest.Mock<any, any>;
    findUnique: jest.Mock<any, any>;
    update: jest.Mock<any, any>;
    delete: jest.Mock<any, any>;
    count: jest.Mock<any, any>;
    updateMany: jest.Mock<any, any>;
  };
  $transaction: jest.Mock<any, any>; // Adicionar o $transaction também
}

  const mockPrisma : MockPrismaService = {
    list: {
      findUnique : jest.fn(),
    },
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },

    $transaction: jest.fn().mockImplementation((arg) => {
      if (typeof arg=== 'function') {
        return arg(mockPrisma);
      }
      return Promise.resolve(arg);
    }),
  };

  beforeEach(async () => {
    mockPrisma.task.count.mockResolvedValue(0);
    mockPrisma.task.updateMany.mockResolvedValue({count : 1});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BoardGateway, useValue: mockBoardGateway },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar uma tarefa com os dados corretos', async () => {
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

      mockPrisma.list.findUnique.mockResolvedValue({ boardId: 'board-1' });
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
    it('deve retornar todas as tarefas de uma lista ordenadas por posição', async () => {
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
    it('deve retornar uma tarefa pelo id', async () => {
      const id = 'task-1';
      const task = { id, title: 'Teste' };

      mockPrisma.task.findUnique.mockResolvedValue(task);

      const result = await service.findOne(id);

      expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(task);
    });
  });

  describe('update', () => {
    it('deve atualizar uma tarefa se ela existir', async () => {
      const id = 'task-1';
      const dto: UpdateTaskDto = { title: 'Atualizada' };
      const existingTask = { id };
      const updatedTask = {
        id,
        title: 'Atualizada',
        list: { boardId: 'board-1' },
      };
      const updatedTaskReturn = { id, title: 'Atualizada' };

      mockPrisma.task.findUnique.mockResolvedValue(existingTask);
      mockPrisma.task.update.mockResolvedValue(updatedTask);

      const result = await service.update(id, dto);

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id },
        data: dto,
        include: { list: { select: { boardId: true } } },
      });
      expect(result).toEqual(updatedTaskReturn);
    });
  });

  it('deve remover uma tarefa e ajustar a posição das demais', async () => {
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

    await service.remove(taskId);

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
  })

  describe('updatePosition', () => {
    const taskId = 'task-move';
    const findUniqueMock = { id: taskId, listId: 'list-1', position: 3 };

    it('should move a task up and increment positions of tasks between old and new position', async () => {
      const oldPosition = 3;
      const newPosition = 1;

      mockPrisma.task.findUnique.mockResolvedValue({ ...findUniqueMock, position: oldPosition });
      mockPrisma.task.update.mockResolvedValue({ id: taskId, position: newPosition });

      await service.updatePosition(taskId, newPosition);

      expect(mockPrisma.task.updateMany).toHaveBeenCalledWith({
        where: {
          position: { gte: newPosition, lt: oldPosition },
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

    it('should move a task down and decrement positions of tasks between old and new position', async () => {
      const oldPosition = 1;
      const newPosition = 3;

      mockPrisma.task.findUnique.mockResolvedValue({ ...findUniqueMock, position: oldPosition });
      mockPrisma.task.update.mockResolvedValue({ id: taskId, position: newPosition });

      await service.updatePosition(taskId, newPosition);

      expect(mockPrisma.task.updateMany).toHaveBeenCalledWith({
        where: {
          position: { gt: oldPosition, lte: newPosition },
        },
        data: {
          position: { decrement: 1 },
        },
      });

      expect(mockPrisma.task.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { position: newPosition },
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
        mockPrisma.task.findUnique.mockResolvedValue(null); 
        await expect(service.updatePosition(taskId, 5)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findTasksOverdueDate', () => {
    it('should return overdue tasks with correct filters and includes', async () => {
      const userId = 'user-overdue';
      const today = new Date('2025-10-28T10:00:00Z');
      jest.useFakeTimers().setSystemTime(today);

      const mockTasks = [{ id: 'task-overdue', dueDate: new Date('2025-10-27') }];
      mockPrisma.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.findTasksOverdueDate(userId);

      const expectedEndOfDay = endOfDay(today);

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith({
        where: {
          creatorId: userId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: {
            lte: expectedEndOfDay,
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
      expect(result).toEqual(mockTasks);

      jest.useRealTimers();
    });
  });

  describe('moveTaskToList', () => {
    const taskId = 'task-move-1';
    const oldListId = 'list-old';
    const newListId = 'list-new';
    const newPosition = 2;
    const taskToMove = { id: taskId, listId: oldListId, position: 5 };
    const updatedTask = { id: taskId, listId: newListId, position: newPosition };

    beforeEach(() => {
        mockPrisma.task.findUnique.mockResolvedValue(taskToMove);
        mockPrisma.list.findUnique.mockResolvedValue({ id: newListId });
        mockPrisma.task.updateMany.mockResolvedValue({ count: 1 });
        mockPrisma.task.update.mockResolvedValue(updatedTask);
    });

    it('should execute transaction to move task and adjust positions in both lists', async () => {

        const result = await service.moveTaskToList(taskId, newListId, newPosition);

        expect(mockPrisma.task.findUnique).toHaveBeenCalledWith({ where: { id: taskId } });
        expect(mockPrisma.list.findUnique).toHaveBeenCalledWith({ where: { id: newListId } });
        expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

        expect(mockPrisma.task.updateMany).toHaveBeenCalledWith({
            where: {
                listId: oldListId,
                position: { gt: taskToMove.position },
            },
            data: {
                position: { decrement: 1 },
            },
        });
      
        expect(mockPrisma.task.updateMany).toHaveBeenCalledWith({
            where: {
                listId: newListId,
                position: { gte: newPosition },
            },
            data: {
                position: { increment: 1 },
            },
        });

        expect(mockPrisma.task.update).toHaveBeenCalledWith({
            where: { id: taskId },
            data: {
                listId: newListId,
                position: newPosition,
            },
        });
        
        expect(result).toEqual(updatedTask);
    });

    it('should throw NotFoundException if task is not found', async () => {
        mockPrisma.task.findUnique.mockResolvedValue(null);
        await expect(service.moveTaskToList(taskId, newListId, newPosition)).rejects.toThrow(
            new NotFoundException('Task não encontrada'),
        );
    });

    it('should throw NotFoundException if target list is not found', async () => {
        mockPrisma.list.findUnique.mockResolvedValue(null);
        await expect(service.moveTaskToList(taskId, newListId, newPosition)).rejects.toThrow(
            new NotFoundException('Lista de destino não encontrada'),
        );
    });
  });
});
