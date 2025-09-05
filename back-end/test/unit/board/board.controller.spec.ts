import { Test, TestingModule } from '@nestjs/testing';
import { BoardController } from 'src/board/board.controller';
import { BoardService } from 'src/board/board.service';
import { CreateBoardDto } from 'src/board/dto/create-board.dto';
import { UpdateBoardDto } from 'src/board/dto/update-board.dto';
import { BoardVisibility } from 'src/common/enums/board-visibility.enum';
import { AuthenticatedUser } from 'src/types/user.interface';

describe('BoardController', () => {
  let controller: BoardController;

  const mockBoardService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser: AuthenticatedUser = {
    id: 'user-id',
    email: 'test@example.com',
    name: 'Test User',
    userName: 'testuser',
    role: 'ADMIN',
    authProvider: 'local',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardController],
      providers: [{ provide: BoardService, useValue: mockBoardService }],
    }).compile();

    controller = module.get<BoardController>(BoardController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call service.create with user id and dto', async () => {
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
    it('should call service.findAll with user id', async () => {
      const boards = [{ id: '1', title: 'Board 1', ownerId: mockUser.id }];
      mockBoardService.findAll.mockResolvedValue(boards);

      const result = await controller.findAll(mockUser);
      expect(result).toEqual(boards);
      expect(mockBoardService.findAll).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const board = { id: '1', title: 'Board 1' };
      mockBoardService.findOne.mockResolvedValue(board);

      const result = await controller.findOne('1');
      expect(result).toEqual(board);
      expect(mockBoardService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should call service.update with id and dto', async () => {
      const dto: UpdateBoardDto = { title: 'Updated Title' };
      const updatedBoard = { id: '1', title: 'Updated Title' };
      mockBoardService.update.mockResolvedValue(updatedBoard);

      const result = await controller.update('1', dto);
      expect(result).toEqual(updatedBoard);
      expect(mockBoardService.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      const deletedBoard = { id: '1', title: 'Deleted' };
      mockBoardService.remove.mockResolvedValue(deletedBoard);

      const result = await controller.remove('1');
      expect(result).toEqual(deletedBoard);
      expect(mockBoardService.remove).toHaveBeenCalledWith('1');
    });
  });
});
