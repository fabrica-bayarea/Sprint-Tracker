import { Test, TestingModule } from '@nestjs/testing';
import { ListService } from 'src/list/list.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateListDto } from 'src/list/dto/create-list.dto';
import { UpdateListDto } from 'src/list/dto/update-list.dto';

describe('ListService', () => {
  let service: ListService;

  const mockPrisma = {
    board: {
      findFirst: jest.fn(),
    },
    list: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ListService>(ListService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a list if board belongs to user', async () => {
      const ownerId = 'user-123';
      const dto: CreateListDto = {
        boardId: 'board-1',
        title: 'To do',
        position: 1,
      };

      mockPrisma.board.findFirst.mockResolvedValue({ id: dto.boardId });
      mockPrisma.list.create.mockResolvedValue({ id: 'list-1', ...dto });

      const result = await service.create(ownerId, dto);

      expect(mockPrisma.board.findFirst).toHaveBeenCalledWith({
        where: { id: dto.boardId, ownerId },
      });
      expect(mockPrisma.list.create).toHaveBeenCalledWith({
        data: dto,
      });
      expect(result).toEqual({ id: 'list-1', ...dto });
    });

    it('should throw ForbiddenException if user is not board owner', async () => {
      const dto: CreateListDto = {
        boardId: 'board-1',
        title: 'To do',
        position: 1,
      };
      mockPrisma.board.findFirst.mockResolvedValue(null);

      await expect(service.create('user-123', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAll', () => {
    it("should return all lists from user's board", async () => {
      const ownerId = 'user-123';
      const boardId = 'board-1';
      const lists = [{ id: 'list-1', title: 'To do' }];

      mockPrisma.board.findFirst.mockResolvedValue({ id: boardId });
      mockPrisma.list.findMany.mockResolvedValue(lists);

      const result = await service.findAll(ownerId, boardId);

      expect(mockPrisma.board.findFirst).toHaveBeenCalledWith({
        where: {
          id: boardId,
          ownerId,
        },
      });
      expect(mockPrisma.list.findMany).toHaveBeenCalledWith({
        where: { boardId, isArchived: false },
        orderBy: { position: 'asc' },
        include: { tasks: true },
      });
      expect(result).toEqual(lists);
    });

    it('should throw ForbiddenException if board not owned by user', async () => {
      mockPrisma.board.findFirst.mockResolvedValue(null);

      await expect(service.findAll('user-123', 'board-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('should return the list if it exists', async () => {
      const list = { id: 'list-1', title: 'To do' };
      mockPrisma.list.findUnique.mockResolvedValue(list);

      const result = await service.findOne('list-1');
      expect(mockPrisma.list.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
      });
      expect(result).toEqual(list);
    });

    it('should throw NotFoundException if list not found', async () => {
      mockPrisma.list.findUnique.mockResolvedValue(null);

      await expect(service.findOne('list-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a list after confirming it exists', async () => {
      const id = 'list-1';
      const dto: UpdateListDto = { title: 'Updated' };
      const updated = { id, title: 'Updated' };

      mockPrisma.list.findUnique.mockResolvedValue({ id });
      mockPrisma.list.update.mockResolvedValue(updated);

      const result = await service.update(id, dto);

      expect(mockPrisma.list.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockPrisma.list.update).toHaveBeenCalledWith({
        where: { id },
        data: dto,
      });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should delete a list after confirming it exists', async () => {
      const id = 'list-1';
      const deleted = { id, title: 'To do' };

      mockPrisma.list.findUnique.mockResolvedValue({ id });
      mockPrisma.list.delete.mockResolvedValue(deleted);

      const result = await service.remove(id);

      expect(mockPrisma.list.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(mockPrisma.list.delete).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(deleted);
    });
  });
});
