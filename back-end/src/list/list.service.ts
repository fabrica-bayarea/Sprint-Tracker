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

  async findAll(userId: string, boardId: string) {
    const board = await this.prisma.board.findFirst({
      where: { id: boardId },
      include: {
        members: { where: { userId } },
      },
    });

    if (!board) {
      throw new ForbiddenException('Você não tem acesso a este board.');
    }

    const isOwner = board.ownerId === userId;
    const isMember = board.members.length > 0;

    if (!isOwner && !isMember) {
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
        },
        data: {
          position: { increment: 1 },
        },
      });
    } else if (newPosition > oldPosition) {
      await this.prisma.list.updateMany({
        where: {
          position: { gt: oldPosition, lte: newPosition },
        },
        data: {
          position: { decrement: 1 },
        },
      });
    }

    await this.prisma.list.update({
      where: { id },
      data: { position: newPosition },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.list.delete({ where: { id } });
  }
}
