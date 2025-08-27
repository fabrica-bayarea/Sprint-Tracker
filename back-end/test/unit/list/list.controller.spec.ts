import { Test, TestingModule } from '@nestjs/testing';
import { ListController } from '../../../src/list/list.controller';
import { ListService } from '../../../src/list/list.service';
import { CreateListDto } from '../../../src/list/dto/create-list.dto';
import { UpdateListDto } from '../../../src/list/dto/update-list.dto';
import { AuthenticatedUser } from '../../../src/types/user.interface';

describe('ListController', () => {
  let controller: ListController;

  const mockListService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListController],
      providers: [{ provide: ListService, useValue: mockListService }],
    }).compile();

    controller = module.get<ListController>(ListController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const user: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    userName: 'testuser',
    role: 'ADMIN',
    authProvider: 'local',
  };

  describe('create', () => {
    it('should call listService.create with correct params', async () => {
      const dto: CreateListDto = {
        boardId: 'board-1',
        title: 'Nova Lista',
        position: 1,
      };

      const expectedResult = { id: 'list-1', ...dto };
      mockListService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(user, dto);

      expect(mockListService.create).toHaveBeenCalledWith(user.id, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should call listService.findAll with correct params', async () => {
      const boardId = 'board-1';
      const expectedLists = [{ id: 'list-1' }, { id: 'list-2' }];
      mockListService.findAll.mockResolvedValue(expectedLists);

      const result = await controller.findAll(user, boardId);

      expect(mockListService.findAll).toHaveBeenCalledWith(user.id, boardId);
      expect(result).toEqual(expectedLists);
    });
  });

  describe('findOne', () => {
    it('should call listService.findOne with correct id', async () => {
      const id = 'list-123';
      const expectedList = { id, title: 'Minha Lista' };
      mockListService.findOne.mockResolvedValue(expectedList);

      const result = await controller.findOne(id);

      expect(mockListService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedList);
    });
  });

  describe('update', () => {
    it('should call listService.update with correct params', async () => {
      const id = 'list-123';
      const dto: UpdateListDto = { title: 'Atualizada', position: 2 };
      const expectedResult = { id, ...dto };

      mockListService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, dto);

      expect(mockListService.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should call listService.remove with correct id', async () => {
      const id = 'list-123';
      const expectedResult = { id, deleted: true };

      mockListService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(mockListService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });
});
