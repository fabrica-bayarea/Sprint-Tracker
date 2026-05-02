import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { BoardService } from '@/board/board.service';
import { BoardVisibility } from '@/common/enums/board-visibility.enum';
import { BoardGateway } from '@/events/board.gateway';
import { NotificationsGateway } from '@/events/notification.gateway';
import { PrismaService } from '@/prisma/prisma.service';

import {
  mockPrisma,
  mockBoardGateway,
  mockNotificationGateway,
} from '../setup-mock';

describe('BoardService', () => {
  let service: BoardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BoardGateway, useValue: mockBoardGateway },
        { provide: NotificationsGateway, useValue: mockNotificationGateway },
      ],
    }).compile();

    service = module.get<BoardService>(BoardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um quadro (board)', async () => {
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
      expect(mockPrisma.boardMember.create).toHaveBeenCalledWith({
        data: {
          boardId: result.id,
          userId: ownerId,
          role: 'ADMIN',
        },
      });
    });
  });

  describe('findAll', () => {
    it('deve retornar uma lista de quadros (boards)', async () => {
      const idUser = 'user-id';
      const boards = [
        { id: '1', title: 'Board 1', idUser, _count: { members: 0 } },
      ];
      mockPrisma.board.findMany.mockResolvedValue(boards);

      const result = await service.findAll(idUser);
      expect(result).toEqual([
        { id: '1', title: 'Board 1', idUser, memberCount: 0 },
      ]);
      expect(mockPrisma.board.findMany).toHaveBeenCalledWith({
        where: { members: { some: { userId: idUser } }, isArchived: false },
        include: {
          _count: {
            select: { members: true },
          },
        },
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar um quadro (board)', async () => {
      const board = { id: '1', title: 'Board 1' };
      mockPrisma.board.findUnique.mockResolvedValue(board);

      expect(await service.findOne('1')).toEqual(board);
    });

    it('deve lançar NotFoundException se não for encontrado', async () => {
      mockPrisma.board.findUnique.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar um quadro (board)', async () => {
      const board = { id: '1', title: 'Old' };
      const dto = { title: 'Updated' };
      mockPrisma.board.findUnique.mockResolvedValue(board);
      mockPrisma.board.update.mockResolvedValue({ ...board, ...dto });

      const result = await service.update('1', dto);
      expect(result.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('deve deletar um quadro (board)', async () => {
      const board = { id: '1', title: 'To Delete' };
      mockPrisma.board.findUnique.mockResolvedValue(board);
      mockPrisma.$transaction.mockImplementation(
        async (callback: (prisma: typeof mockPrisma) => Promise<void>) => {
          return callback(mockPrisma);
        },
      );
      mockPrisma.list.findMany.mockResolvedValue([]);
      mockPrisma.label.findMany.mockResolvedValue([]);
      mockPrisma.invite.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.boardMember.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.board.delete.mockResolvedValue(board);

      const result = await service.remove('1');
      expect(result).toEqual({ message: 'Quadro excluído com sucesso' });
    });
  });
});
