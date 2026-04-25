import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from 'src/task/task.controller';
import { TaskService } from 'src/task/task.service';
import { CreateTaskDto } from 'src/task/dto/create-task.dto';
import { UpdateTaskDto } from 'src/task/dto/update-task.dto';
import { AuthenticatedUser } from 'src/types/user.interface';
import { TaskStatus } from 'src/common/enums/task-status.enum';

describe('TaskController', () => {
  let controller: TaskController;

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    userName: 'testuser',
    role: 'ADMIN',
    authProvider: 'local',
  };

  const mockTaskService = {
    create: jest.fn(),
    findAllByList: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [{ provide: TaskService, useValue: mockTaskService }],
    }).compile();

    controller = module.get<TaskController>(TaskController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call taskService.create with user.id and dto', async () => {
      const dto: CreateTaskDto = {
        title: 'Nova tarefa',
        listId: 'list-1',
        status: TaskStatus.TODO,
      };
      const expectedResult = { id: 'task-1', ...dto, creatorId: mockUser.id };

      mockTaskService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(mockUser, dto);

      expect(mockTaskService.create).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should call taskService.findAllByList with listId', async () => {
      const listId = 'list-1';
      const expectedTasks = [{ id: 'task-1' }, { id: 'task-2' }];

      mockTaskService.findAllByList.mockResolvedValue(expectedTasks);

      const result = await controller.findAll(listId);

      expect(mockTaskService.findAllByList).toHaveBeenCalledWith(listId);
      expect(result).toEqual(expectedTasks);
    });
  });

  describe('findOne', () => {
    it('should call taskService.findOne with task id', async () => {
      const id = 'task-1';
      const expectedTask = { id, title: 'Tarefa' };

      mockTaskService.findOne.mockResolvedValue(expectedTask);

      const result = await controller.findOne(id);

      expect(mockTaskService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedTask);
    });
  });

  describe('update', () => {
    it('should call taskService.update with id, userId and dto', async () => {
      const id = 'task-1';
      const dto: UpdateTaskDto = { title: 'Atualizado' };
      const updatedTask = { id, title: 'Atualizado' };

      mockTaskService.update.mockResolvedValue(updatedTask);

      const result = await controller.update(id, mockUser, dto);

      expect(mockTaskService.update).toHaveBeenCalledWith(id, mockUser.id, dto);
      expect(result).toEqual(updatedTask);
    });
  });

  describe('remove', () => {
    it('should call taskService.remove with id and userId', async () => {
      const id = 'task-1';
      const removed = { id };

      mockTaskService.remove.mockResolvedValue(removed);

      const result = await controller.remove(id, mockUser);

      expect(mockTaskService.remove).toHaveBeenCalledWith(id, mockUser.id);
      expect(result).toEqual(removed);
    });
  });
});
