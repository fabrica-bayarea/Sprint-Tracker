import { Test, TestingModule } from '@nestjs/testing';

import { BoardRoleGuard } from '@/auth/guards/board-role.guard';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { CreateListDto } from '@/list/dto/create-list.dto';
import { UpdateListDto } from '@/list/dto/update-list.dto';
import { ListController } from '@/list/list.controller';
import { ListService } from '@/list/list.service';

describe('ListController', () => {
  let controller: ListController;

  const mockListService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updatePosition: jest.fn(),
  };

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      providers: [{ provide: ListService, useValue: mockListService }],
      controllers: [ListController],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(BoardRoleGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) });

    const module: TestingModule = await moduleBuilder.compile();
    controller = module.get<ListController>(ListController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve chamar listService.create com os parâmetros corretos', async () => {
      const dto: CreateListDto = {
        boardId: 'board-1',
        title: 'Nova Lista',
        position: 1,
      };

      const expectedResult = { id: 'list-1', ...dto };
      mockListService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);

      expect(mockListService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('deve chamar listService.findAll com os parâmetros corretos', async () => {
      const boardId = 'board-1';
      const expectedLists = [{ id: 'list-1' }, { id: 'list-2' }];
      mockListService.findAll.mockResolvedValue(expectedLists);

      const result = await controller.findAll(boardId);

      expect(mockListService.findAll).toHaveBeenCalledWith(boardId);
      expect(result).toEqual(expectedLists);
    });
  });

  describe('findOne', () => {
    it('deve chamar listService.findOne com o id correto', async () => {
      const id = 'list-123';
      const expectedList = { id, title: 'Minha Lista' };
      mockListService.findOne.mockResolvedValue(expectedList);

      const result = await controller.findOne(id);

      expect(mockListService.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedList);
    });
  });

  describe('update', () => {
    it('deve chamar listService.update com os parâmetros corretos', async () => {
      const id = 'list-123';
      const dto: UpdateListDto = { title: 'Atualizada', position: 2 };
      const expectedResult = { id, ...dto };

      mockListService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, dto);

      expect(mockListService.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updatePosition', () => {
    it('should call listService.updatePosition with id and newPosition', async () => {
      const id = 'list-123';
      const newPosition = 5;
      const dto = { newPosition }; 
      const expectedResult = { id, position: newPosition, title: 'Minha Lista' };

      mockListService.updatePosition.mockResolvedValue(expectedResult);

      const result = await controller.updatePosition(id, dto);

      expect(mockListService.updatePosition).toHaveBeenCalledWith(
        id,
        newPosition,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('deve chamar listService.remove com o id correto', async () => {
      const id = 'list-123';
      const expectedResult = { id, deleted: true };

      mockListService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(mockListService.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });
});
