import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from '../../../src/board/board.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { BoardVisibility } from 'src/common/enums/board-visibility.enum';

const mockPrisma = {
  board: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('BoardService', () => {
  let service: BoardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BoardService>(BoardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a board', async () => {
      const dto = {
        title: 'Test Board',
        description: 'Desc',
        visibility: BoardVisibility.PRIVATE,
      };
      const ownerId = 'user-id';
      const result = { id: 'board-id', ...dto, ownerId };
      mockPrisma.board.create.mockResolvedValue(result);

      expect(await service.create(ownerId, dto)).toEqual(result);
      expect(mockPrisma.board.create).toHaveBeenCalledWith({
        data: { ...dto, ownerId },
      });
    });
  });

  describe('findAll', () => {
    it('should return a list of boards', async () => {
      const ownerId = 'user-id';
      const boards = [{ id: '1', title: 'Board 1', ownerId }];
      mockPrisma.board.findMany.mockResolvedValue(boards);

      expect(await service.findAll(ownerId)).toEqual(boards);
      expect(mockPrisma.board.findMany).toHaveBeenCalledWith({
        where: { ownerId, isArchived: false },
        include: {
          lists: {
            include: {
              tasks: true,
            },
          },
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a board', async () => {
      const board = { id: '1', title: 'Board 1' };
      mockPrisma.board.findUnique.mockResolvedValue(board);

      expect(await service.findOne('1')).toEqual(board);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.board.findUnique.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a board', async () => {
      const board = { id: '1', title: 'Old' };
      const dto = { title: 'Updated' };
      mockPrisma.board.findUnique.mockResolvedValue(board);
      mockPrisma.board.update.mockResolvedValue({ ...board, ...dto });

      const result = await service.update('1', dto);
      expect(result.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should delete a board', async () => {
      const board = { id: '1', title: 'To Delete' };
      mockPrisma.board.findUnique.mockResolvedValue(board);
      mockPrisma.board.delete.mockResolvedValue(board);

      const result = await service.remove('1');
      expect(result).toEqual(board);
    });
  });
});
