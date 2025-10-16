import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';

@Injectable()
export class ListService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateListDto) {
    const board = await this.prisma.board.findFirst({
      where: {
        id: dto.boardId,
        ownerId,
      },
    });

    if (!board) {
      throw new ForbiddenException(
        'Você não tem permissão para criar lista nesse board.',
      );
    }

    return this.prisma.list.create({
      data: {
        boardId: dto.boardId,
        title: dto.title,
        position: dto.position,
      },
    });
  }

  async findAll(ownerId: string, boardId: string) {
    const board = await this.prisma.board.findFirst({
      where: {
        id: boardId,
        ownerId,
      },
    });

    if (!board) {
      throw new ForbiddenException('Você não tem acesso a este board.');
    }

    return this.prisma.list.findMany({
      where: { boardId, isArchived: false },
      orderBy: { position: 'asc' },
      include: {
        tasks: true,
      },
    });
  }

  async findOne(id: string) {
    const list = await this.prisma.list.findUnique({ where: { id } });
    if (!list) throw new NotFoundException('List not found');
    return list;
  }

  async update(id: string, dto: UpdateListDto) {
    await this.findOne(id);
    return this.prisma.list.update({
      where: { id },
      data: dto,
    });
  }

  async updatePosition(id: string, newPosition: number) {
    const list = await this.findOne(id);
    const oldPosition = list.position;

    if (newPosition < oldPosition) {
      await this.prisma.list.updateMany({
        where: {
          position: { gte: newPosition, lt: oldPosition },
          boardId: list.boardId, // Adicionando filtro por boardId para evitar bugs
        },
        data: {
          position: { increment: 1 },
        },
      });
    } else if (newPosition > oldPosition) {
      await this.prisma.list.updateMany({
        where: {
          position: { gt: oldPosition, lte: newPosition },
          boardId: list.boardId, // Adicionando filtro por boardId para evitar bugs
        },
        data: {
          position: { decrement: 1 },
        },
      });
    }

    // A operação de update final, que a rota PATCH esperava retornar
    await this.prisma.list.update({
      where: { id },
      data: { position: newPosition },
    });

    // Retorna a lista atualizada para corresponder às expectativas do teste.
    return {
      message: 'Position updated successfully',
      position: newPosition,
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.list.delete({ where: { id } });
    // Retorna uma mensagem de sucesso em vez do objeto deletado, conforme esperado pelo teste
    return { message: 'Lista removida com sucesso' };
  }
}
