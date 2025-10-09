import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

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

  async getBoardById(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: {
        id: boardId,
        ownerId: userId,
      },
    });
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async update(id: string, userId: string, dto: UpdateBoardDto) {
    console.log(
      `[BoardService.update] Received ID: ${id}, UserID from token: ${userId}`,
    );

    // Adiciona log de diagnóstico para verificar o ownerId do banco de dados
    const board = await this.prisma.board.findUnique({
      where: { id },
    });

    if (board) {
      console.log(
        `[BoardService.update] Found board. OwnerID from DB: ${board.ownerId}`,
      );
      if (board.ownerId !== userId) {
        console.log(
          `[BoardService.update] WARNING: UserID from token does not match OwnerID from DB.`,
        );
      }
    } else {
      console.log(
        `[BoardService.update] Board with ID ${id} not found in the database.`,
      );
    }

    try {
      const updatedBoard = await this.prisma.board.update({
        where: {
          id: id,
          ownerId: userId,
        },
        data: {
          title: dto.title,
          description: dto.description,
          visibility: dto.visibility,
        },
      });
      return updatedBoard;
    } catch {
      // Handle the case where the board is not found for the given user
      throw new NotFoundException(
        'Board not found or you do not have permission to update it.',
      );
    }
  }

  async remove(id: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: {
        id,
      },
    });
    if (!board) {
      throw new NotFoundException('Board not found.');
    }
    if (board.ownerId !== userId) {
      throw new NotFoundException(
        'You do not have permission to delete this board.',
      );
    }
    await this.prisma.board.delete({
      where: {
        id,
      },
    });
    return { message: 'Board removed successfully' };
  }
}
