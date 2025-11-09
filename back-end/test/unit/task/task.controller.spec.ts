import { Test, TestingModule } from '@nestjs/testing';

import { BoardRoleGuard } from '@/auth/guards/board-role.guard';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { CreateTaskDto } from '@/task/dto/create-task.dto';
import { UpdateTaskDto } from '@/task/dto/update-task.dto';
import { TaskController } from '@/task/task.controller';
import { TaskService } from '@/task/task.service';
import { AuthenticatedUser } from '@/types/user.interface';

describe('TaskController', () => {
  let controller: TaskController;

  const mockTaskService = {
    create: jest.fn(),
    findAllByList: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [TaskController],
      providers: [{ provide: TaskService, useValue: mockTaskService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(BoardRoleGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) });

    const module: TestingModule = await moduleBuilder.compile();

    controller = module.get<TaskController>(TaskController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve chamar taskService.create com user.id e o dto', async () => {
      const user: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        userName: 'testuser',
        role: 'ADMIN',
        authProvider: 'local',
      };
      const dto: CreateTaskDto = {
        title: 'Nova tarefa',
        listId: 'list-1',
        status: TaskStatus.TODO,
      };
      const expectedResult = { id: 'task-1', ...dto, creatorId: user.id };

      mockTaskService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(user, dto);

      expect(mockTaskService.create).toHaveBeenCalledWith(user.id, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('deve chamar taskService.findOne com o id da tarefa', async () => {
      const id = 'task-1';
      const expectedTask = { id, title: 'Tarefa' };

      mockTaskService.findOne.mockResolvedValue(expectedTask);

      const result = await controller.findOne(id);

      expect(mockTaskService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedTask);
    });
  });

  describe('update', () => {
    it('deve chamar taskService.update com o id e o dto', async () => {
      const id = 'task-1';
      const dto: UpdateTaskDto = { title: 'Atualizado' };
      const updatedTask = { id, title: 'Atualizado' };

      mockTaskService.update.mockResolvedValue(updatedTask);

      const result = await controller.update(id, dto);

      expect(mockTaskService.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(updatedTask);
    });
  });

  describe('remove', () => {
    it('deve chamar taskService.remove com o id', async () => {
      const id = 'task-1';
      const removed = { id };

      mockTaskService.remove.mockResolvedValue(removed);

      const result = await controller.remove(id);

      expect(mockTaskService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(removed);
    });
  });
});
