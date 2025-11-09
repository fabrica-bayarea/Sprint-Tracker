import { Test, TestingModule } from '@nestjs/testing';

import { TaskStatus } from '@/common/enums/task-status.enum';
import { BoardGateway } from '@/events/board.gateway';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTaskDto } from '@/task/dto/create-task.dto';
import { UpdateTaskDto } from '@/task/dto/update-task.dto';
import { TaskService } from '@/task/task.service';

import { mockPrisma, mockBoardGateway } from '../setup-mock';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(async () => {
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
});
