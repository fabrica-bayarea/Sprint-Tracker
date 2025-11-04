import { Injectable, NotFoundException } from '@nestjs/common';

import { BoardGateway } from '@/events/board.gateway';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';

@Injectable()
export class ListService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardGateway: BoardGateway,
  ) {}

  /**
   * Cria uma nova lista no quadro e emite evento de criação.
   */
  async create(dto: CreateListDto) {
    const list = await this.prisma.list.create({
      data: {
        boardId: dto.boardId,
        title: dto.title,
        position: dto.position,
      },
    });

    const payload = {
      boardId: list.boardId,
      action: 'created list',
      at: new Date().toISOString(),
    };
    this.boardGateway.emitModifiedInBoard(list.boardId, payload);

    return list;
  }

  /**
   * Lista todas as listas ativas de um quadro, ordenadas pela posição.
   */
  async findAll(boardId: string) {
    return this.prisma.list.findMany({
      where: { boardId, isArchived: false },
      orderBy: { position: 'asc' },
      include: {
        tasks: true,
      },
    });
  }

  /**
   * Busca uma lista pelo ID ou lança erro se não for encontrada.
   */
  async findOne(listId: string) {
    const list = await this.prisma.list.findUnique({ where: { id: listId } });
    if (!list) throw new NotFoundException('Lista não encontrada');
    return list;
  }

  /**
   * Atualiza os dados de uma lista e emite evento de atualização.
   */
  async update(listId: string, dto: UpdateListDto) {
    const exists = await this.prisma.list.findUnique({ where: { id: listId } });
    if (!exists) throw new NotFoundException('List não encontrada');

    const updated = await this.prisma.list.update({
      where: { id: listId },
      data: dto,
    });

    const payload = {
      boardId: updated.boardId,
      action: 'updated list',
      at: new Date().toISOString(),
    };
    this.boardGateway.emitModifiedInBoard(updated.boardId, payload);

    return updated;
  }

  /**
   * Atualiza a posição de uma lista e reordena as demais conforme necessário.
   */
  async updatePosition(listId: string, newPosition: number) {
    const list = await this.prisma.list.findUnique({ where: { id: listId } });
    if (!list) throw new NotFoundException('List não encontrada');
    const oldPosition = list.position;

    if (newPosition < oldPosition) {
      await this.prisma.list.updateMany({
        where: {
          boardId: list.boardId,
          position: { gte: newPosition, lt: oldPosition },
        },
        data: {
          position: { increment: 1 },
        },
      });
    } else if (newPosition > oldPosition) {
      await this.prisma.list.updateMany({
        where: {
          boardId: list.boardId,
          position: { gt: oldPosition, lte: newPosition },
        },
        data: {
          position: { decrement: 1 },
        },
      });
    }

    await this.prisma.list.update({
      where: { id: listId },
      data: { position: newPosition },
    });

    const payload = {
      boardId: list.boardId,
      action: 'updated list position',
      at: new Date().toISOString(),
    };
    this.boardGateway.emitModifiedInBoard(list.boardId, payload);
  }

  /**
   * Remove uma lista pelo ID e emite evento de exclusão.
   */
  async remove(listId: string) {
    const exists = await this.prisma.list.findUnique({ where: { id: listId } });
    if (!exists) throw new NotFoundException('List não encontrada');

    const deleted = await this.prisma.list.delete({ where: { id: listId } });

    const payload = {
      boardId: deleted.boardId,
      action: 'deleted list',
      at: new Date().toISOString(),
    };
    this.boardGateway.emitModifiedInBoard(deleted.boardId, payload);

    return deleted;
  }
}
