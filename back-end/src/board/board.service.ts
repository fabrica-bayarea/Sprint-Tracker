import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { Role } from '@prisma/client';

@Injectable()
export class BoardService {
  constructor(private readonly prisma: PrismaService) {}

  create(ownerId: string, dto: CreateBoardDto) {
    return this.prisma.board.create({
      data: {
        ...dto,
        ownerId,
      },
    });
  }

  findAll(ownerId: string) {
    return this.prisma.board.findMany({
      where: { ownerId, isArchived: false },
      include: {
        lists: {
          include: {
            tasks: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        members: { select: { userId: true, role: true } },
        lists: {
          orderBy: { position: 'asc' },
          include: { tasks: { where: { deletedAt: null }, orderBy: { position: 'asc' } } },
        },
      },
    });
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async getUserRole(boardId: string, userId: string): Promise<Role | 'OWNER' | null> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { members: { where: { userId } } },
    });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId === userId) return 'OWNER';
    if (board.members.length > 0) return board.members[0].role;
    return null;
  }

  async update(id: string, dto: UpdateBoardDto) {
    await this.findOne(id);
    return this.prisma.board.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.board.delete({ where: { id } });
  }
}
