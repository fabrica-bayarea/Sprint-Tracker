import { PrismaService } from '../prisma/prisma.service';
import { CreateBacklogDto } from './dto/create-backlog.dto';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class BacklogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(BacklogDto: CreateBacklogDto) {
    try {
      const board = await this.prisma.board.findUnique({
        where: { id: BacklogDto.boardId },
      });

      if (!board) {
        throw new NotFoundException('Board not found');
      }

      return this.prisma.backlog.create({
        data: {
          boardId: BacklogDto.boardId,
          title: BacklogDto.title,
          description: BacklogDto.description,
          priority: BacklogDto.priority,
          status: BacklogDto.status,
        },
      });
    } catch (error) {
      console.error('Error creating backlog:', error);
    }
  }

  async findAll() {
    return this.prisma.backlog.findMany();
  }

  async findOne(id: string) {
    return this.findBacklog(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.backlog.delete({ where: { id } });
  }

  async findBacklog(id: string) {
    const backlog = await this.prisma.backlog.findUnique({ where: { id } });
    if (!backlog) throw new NotFoundException('Backlog not found');
    return backlog;
  }
}
