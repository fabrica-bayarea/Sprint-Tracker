import { Test, TestingModule } from '@nestjs/testing';

import { BoardRoleGuard } from '@/auth/guards/board-role.guard';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { BoardController } from '@/board/board.controller';
import { BoardService } from '@/board/board.service';
import { CreateBoardDto } from '@/board/dto/create-board.dto';
import { UpdateBoardDto } from '@/board/dto/update-board.dto';
import { BoardVisibility } from '@/common/enums/board-visibility.enum';

import { mockUser } from '../setup-mock';

describe('BoardController', () => {
  let controller: BoardController;
  const mockBoardService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [BoardController],
      providers: [{ provide: BoardService, useValue: mockBoardService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(BoardRoleGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) });

    const module: TestingModule = await moduleBuilder.compile();
    controller = module.get<BoardController>(BoardController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve chamar service.create com o id do usuário e o dto', async () => {
      const dto: CreateBoardDto = {
        title: 'Test Board',
        description: 'Description',
        visibility: BoardVisibility.PRIVATE,
      };
      const expected = { id: 'board-id', ...dto, ownerId: mockUser.id };
      mockBoardService.create.mockResolvedValue(expected);

      const result = await controller.create(mockUser, dto);
      expect(result).toEqual(expected);
      expect(mockBoardService.create).toHaveBeenCalledWith(mockUser.id, dto);
    });
  });

  describe('findAll', () => {
    it('deve chamar service.findAll com o id do usuário', async () => {
      const boards = [{ id: '1', title: 'Board 1', ownerId: mockUser.id }];
      mockBoardService.findAll.mockResolvedValue(boards);

      const result = await controller.findAll(mockUser);
      expect(result).toEqual(boards);
      expect(mockBoardService.findAll).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('findOne', () => {
    it('deve chamar service.findOne com o id', async () => {
      const board = { id: '1', title: 'Board 1' };
      mockBoardService.findOne.mockResolvedValue(board);

      const result = await controller.findOne('1');
      expect(result).toEqual(board);
      expect(mockBoardService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('deve chamar service.update com o id e o dto', async () => {
      const dto: UpdateBoardDto = { title: 'Updated Title' };
      const updatedBoard = { id: '1', title: 'Updated Title' };
      mockBoardService.update.mockResolvedValue(updatedBoard);

      const result = await controller.update('1', dto);
      expect(result).toEqual(updatedBoard);
      expect(mockBoardService.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('deve chamar service.remove com o id', async () => {
      const deletedBoard = { id: '1', title: 'Deleted' };
      mockBoardService.remove.mockResolvedValue(deletedBoard);

      const result = await controller.remove('1');
      expect(result).toEqual(deletedBoard);
      expect(mockBoardService.remove).toHaveBeenCalledWith('1');
    });
  });
});
