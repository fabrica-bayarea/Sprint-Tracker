import { Test, TestingModule } from '@nestjs/testing';

import { BoardGateway } from '@/events/board.gateway';
import { CreateListDto } from '@/list/dto/create-list.dto';
import { UpdateListDto } from '@/list/dto/update-list.dto';
import { ListService } from '@/list/list.service';
import { PrismaQueries } from '@/prisma/queries';
import { PrismaService } from '@/prisma/prisma.service';

import {
  mockPrisma,
  mockPrismaQueries,
  mockBoardGateway,
} from '../setup-mock';

describe('ListService', () => {
  let service: ListService;

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      providers: [
        ListService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PrismaQueries, useValue: mockPrismaQueries },
        { provide: BoardGateway, useValue: mockBoardGateway },
      ],
    });

    const module: TestingModule = await moduleBuilder.compile();

    service = module.get<ListService>(ListService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar uma lista', async () => {
      const dto: CreateListDto = {
        boardId: 'board-1',
        title: 'To do',
        position: 1,
      };

      mockPrisma.list.create.mockResolvedValue({ id: 'list-1', ...dto });

      const result = await service.create(dto);

      expect(mockPrisma.list.create).toHaveBeenCalledWith({
        data: {
          boardId: dto.boardId,
          title: dto.title,
          position: dto.position,
        },
      });
      expect(result).toEqual({ id: 'list-1', ...dto });
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as listas do quadro', async () => {
      const boardId = 'board-1';
      const lists = [{ id: 'list-1', title: 'To do' }];

      mockPrisma.list.findMany.mockResolvedValue(lists);

      const result = await service.findAll(boardId);

      expect(mockPrisma.list.findMany).toHaveBeenCalledWith({
        where: { boardId, isArchived: false },
        orderBy: { position: 'asc' },
        include: mockPrismaQueries.listInclude,
      });
      expect(result).toEqual(lists);
    });
  });

  describe('findOne', () => {
    it('deve retornar a lista se ela existir', async () => {
      const list = { id: 'list-1', title: 'To do' };
      mockPrisma.list.findUnique.mockResolvedValue(list);

      const result = await service.findOne('list-1');
      expect(mockPrisma.list.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: { tasks: true },
      });
      expect(result).toEqual(list);
    });
  });

  describe('update', () => {
    it('deve atualizar uma lista após confirmar que ela existe', async () => {
      const id = 'list-1';
      const dto: UpdateListDto = { title: 'Updated' };
      const updated = { id, title: 'Updated', boardId: 'board-1' };

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

  describe('updatePosition', () => {
    it('should move a list up and increment positions of lists between old and new position', async () => {
      const id = 'list-2';
      const oldPosition = 3;
      const newPosition = 1;
      const boardId = 'board-1';

      mockPrisma.list.findUnique.mockResolvedValue({
        id,
        position: oldPosition,
        boardId,
      });
      mockPrisma.list.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.list.update.mockResolvedValue({
        id,
        position: newPosition,
        boardId,
      });

      await service.updatePosition(id, newPosition);

      expect(mockPrisma.list.updateMany).toHaveBeenCalledWith({
        where: {
          boardId,
          position: { gte: newPosition, lt: oldPosition },
        },
        data: {
          position: { increment: 1 },
        },
      });

      expect(mockPrisma.list.update).toHaveBeenCalledWith({
        where: { id },
        data: { position: newPosition },
      });
    });

    it('should move a list down and decrement positions of lists between old and new position', async () => {
      const id = 'list-1';
      const oldPosition = 1;
      const newPosition = 3;
      const boardId = 'board-1';

      mockPrisma.list.findUnique.mockResolvedValue({
        id,
        position: oldPosition,
        boardId,
      });
      mockPrisma.list.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.list.update.mockResolvedValue({
        id,
        position: newPosition,
        boardId,
      });

      await service.updatePosition(id, newPosition);

      expect(mockPrisma.list.updateMany).toHaveBeenCalledWith({
        where: {
          boardId,
          position: { gt: oldPosition, lte: newPosition },
        },
        data: {
          position: { decrement: 1 },
        },
      });

      expect(mockPrisma.list.update).toHaveBeenCalledWith({
        where: { id },
        data: { position: newPosition },
      });
    });
  });

  describe('remove', () => {
    it('deve deletar uma lista após confirmar que ela existe', async () => {
      const id = 'list-1';
      const deleted = { id, boardId: 'board-1' };

      mockPrisma.list.findUnique.mockResolvedValue({ id });
      mockPrisma.task.findMany.mockResolvedValue([]);
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
