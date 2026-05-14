import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { Role } from '@prisma/client';

@Injectable()
export class BoardMemberService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Garante que o requester é OWNER ou ADMIN do board.
   */
  private async assertCanManage(boardId: string, requesterId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { members: { where: { userId: requesterId } } },
    });
    if (!board) throw new NotFoundException('Board não encontrado');

    const isOwner = board.ownerId === requesterId;
    const isAdmin = board.members[0]?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Apenas administradores podem gerenciar membros deste board.',
      );
    }
    return board;
  }

  /**
   * Lista membros do board (incluindo o owner). Qualquer membro pode visualizar.
   */
  async list(boardId: string, requesterId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        owner: { select: { id: true, name: true, email: true, userName: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, userName: true } },
          },
        },
      },
    });
    if (!board) throw new NotFoundException('Board não encontrado');

    const isOwner = board.ownerId === requesterId;
    const isMember = board.members.some((m) => m.userId === requesterId);
    if (!isOwner && !isMember) {
      throw new ForbiddenException('Você não tem acesso a este board.');
    }

    const ownerEntry = {
      userId: board.owner.id,
      name: board.owner.name,
      email: board.owner.email,
      userName: board.owner.userName,
      role: 'OWNER' as const,
    };

    const memberEntries = board.members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      userName: m.user.userName,
      role: m.role,
    }));

    return [ownerEntry, ...memberEntries];
  }

  /**
   * Adiciona um usuário (por email) como membro do board.
   * Apenas owner/admin pode executar.
   */
  async add(boardId: string, requesterId: string, dto: AddMemberDto) {
    const board = await this.assertCanManage(boardId, requesterId);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException(
        'Nenhum usuário cadastrado com este email.',
      );
    }

    if (user.id === board.ownerId) {
      throw new ConflictException('O dono do board já tem acesso total.');
    }

    const existing = await this.prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: user.id } },
    });
    if (existing) {
      throw new ConflictException('Este usuário já é membro do board.');
    }

    return this.prisma.boardMember.create({
      data: {
        boardId,
        userId: user.id,
        role: dto.role ?? Role.MEMBER,
      },
      include: {
        user: { select: { id: true, name: true, email: true, userName: true } },
      },
    });
  }

  /**
   * Remove um membro do board. Owner não pode ser removido.
   */
  async remove(boardId: string, requesterId: string, targetUserId: string) {
    const board = await this.assertCanManage(boardId, requesterId);

    if (targetUserId === board.ownerId) {
      throw new ForbiddenException('Não é possível remover o dono do board.');
    }

    const membership = await this.prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: targetUserId } },
    });
    if (!membership) {
      throw new NotFoundException('Membro não encontrado neste board.');
    }

    // Limpa atribuições deste usuário em tarefas do board (assigneeId vira null)
    await this.prisma.task.updateMany({
      where: {
        assigneeId: targetUserId,
        list: { boardId },
      },
      data: { assigneeId: null },
    });

    return this.prisma.boardMember.delete({
      where: { boardId_userId: { boardId, userId: targetUserId } },
    });
  }
}
