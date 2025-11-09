import { Injectable, NotFoundException } from '@nestjs/common';

import { BoardGateway } from '@/events/board.gateway';
import { NotificationsGateway } from '@/events/notification.gateway';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateBoardDto } from './dto/create-board.dto';
import { InviteBoardDto } from './dto/invite-to-board.dto';
import { ResponseInviteBoardDto } from './dto/response-invite.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@Injectable()
export class BoardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly boardGateway: BoardGateway,
  ) {}

  /**
   * Cria um novo quadro e adiciona o proprietário como ADMIN.
   */
  async create(ownerId: string, dto: CreateBoardDto) {
    const board = await this.prisma.board.create({
      data: {
        ...dto,
        ownerId,
      },
    });

    await this.prisma.boardMember.create({
      data: {
        boardId: board.id,
        userId: ownerId,
        role: 'ADMIN',
      },
    });

    return board;
  }

  /**
   * Lista todos os quadros ativos dos quais o usuário participa.
   */
  async findAll(idUser: string) {
    const boards = await this.prisma.board.findMany({
      where: {
        members: {
          some: {
            userId: idUser,
          },
        },
        isArchived: false,
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    return boards.map(({ _count, ...board }) => ({
      ...board,
      memberCount: _count?.members ?? 0,
    }));
  }

  /**
   * Busca um quadro pelo ID ou lança erro se não existir.
   */
  async findOne(id: string) {
    const board = await this.prisma.board.findUnique({ where: { id } });
    if (!board) throw new NotFoundException('Quadro não encontrado');
    return board;
  }

  /**
   * Atualiza os dados de um quadro e emite evento de modificação.
   */
  async update(boardId: string, dto: UpdateBoardDto) {
    await this.findOne(boardId);
    const updated = await this.prisma.board.update({
      where: { id: boardId },
      data: { ...dto },
    });
    const payload = {
      boardId,
      action: 'updated',
      at: new Date().toISOString(),
    };
    this.boardGateway.emitModifiedInBoard(boardId, payload);
    return updated;
  }

  /**
   * Remove um quadro pelo ID.
   */
  async remove(boardId: string) {
    await this.findOne(boardId);
    await this.prisma.$transaction(async (tx) => {
      const lists = await tx.list.findMany({
        where: { boardId },
        select: { id: true },
      });
      const listIds = lists.map((l) => l.id);

      if (listIds.length) {
        const tasks = await tx.task.findMany({
          where: { listId: { in: listIds } },
          select: { id: true },
        });
        const taskIds = tasks.map((t) => t.id);

        if (taskIds.length) {
          await tx.taskLabel.deleteMany({ where: { taskId: { in: taskIds } } });
          await tx.task.deleteMany({ where: { id: { in: taskIds } } });
        }

        await tx.list.deleteMany({ where: { id: { in: listIds } } });
      }

      const labels = await tx.label.findMany({
        where: { boardId },
        select: { id: true },
      });
      const labelIds = labels.map((l) => l.id);
      if (labelIds.length) {
        await tx.taskLabel.deleteMany({ where: { labelId: { in: labelIds } } });
        await tx.label.deleteMany({ where: { id: { in: labelIds } } });
      }

      await tx.invite.deleteMany({ where: { boardId } });

      await tx.boardMember.deleteMany({ where: { boardId } });

      await tx.board.delete({ where: { id: boardId } });
    });

    return { message: 'Quadro excluído com sucesso' };
  }

  /**
   * Lista todos os membros de um quadro, incluindo dados básicos do usuário.
   */
  async listMembers(boardId: string) {
    await this.findOne(boardId);
    return this.prisma.boardMember.findMany({
      where: { boardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            userName: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /**
   * Remove um membro de um quadro.
   * Regras:
   * - Auto-remoção:
   *   - OBSERVER/MEMBER: remove diretamente.
   *   - Dono: transfere para ADMIN mais antigo; se não houver, promove MEMBER mais antigo; se não houver ADMIN/MEMBER, exclui o board e relações.
   * - Remoção de terceiros: somente ADMIN pode remover outras pessoas.
   */
  async removeMember(
    boardId: string,
    memberUserId: string,
    requesterId: string,
  ) {
    const board = await this.findOne(boardId);

    // Se o alvo é o proprietário do quadro
    if (memberUserId === board.ownerId) {
      // Somente o próprio dono pode se remover
      if (requesterId !== memberUserId) {
        throw new NotFoundException(
          'Não é possível remover o proprietário do quadro',
        );
      }

      // Tentar transferir para o ADMIN mais antigo (exceto o atual dono)
      const nextAdmin = await this.prisma.boardMember.findFirst({
        where: {
          boardId,
          role: 'ADMIN',
          userId: { not: requesterId },
        },
        orderBy: { joinedAt: 'asc' },
      });

      if (!nextAdmin) {
        // Não há outro ADMIN. Tentar promover o MEMBER mais antigo (observadores não podem ser promovidos)
        const nextMember = await this.prisma.boardMember.findFirst({
          where: {
            boardId,
            role: 'MEMBER',
            userId: { not: requesterId },
          },
          orderBy: { joinedAt: 'asc' },
        });

        if (!nextMember) {
          // Não há ADMIN nem MEMBER (apenas observadores ou ninguém): excluir board e relacionamentos
          await this.prisma.$transaction(async (tx) => {
            const lists = await tx.list.findMany({
              where: { boardId },
              select: { id: true },
            });
            const listIds = lists.map((l) => l.id);

            const tasks = listIds.length
              ? await tx.task.findMany({
                  where: { listId: { in: listIds } },
                  select: { id: true },
                })
              : [];
            const taskIds = tasks.map((t) => t.id);

            if (taskIds.length) {
              await tx.taskLabel.deleteMany({
                where: { taskId: { in: taskIds } },
              });
              await tx.task.deleteMany({ where: { id: { in: taskIds } } });
            }

            if (listIds.length) {
              await tx.list.deleteMany({ where: { id: { in: listIds } } });
            }

            const labels = await tx.label.findMany({
              where: { boardId },
              select: { id: true },
            });
            const labelIds = labels.map((l) => l.id);
            if (labelIds.length) {
              await tx.taskLabel.deleteMany({
                where: { labelId: { in: labelIds } },
              });
              await tx.label.deleteMany({ where: { id: { in: labelIds } } });
            }

            await tx.invite.deleteMany({ where: { boardId } });
            await tx.boardMember.deleteMany({ where: { boardId } });
            await tx.board.delete({ where: { id: boardId } });
          });

          return {
            message:
              'Quadro excluído, você era o único membro elegível (sem ADMIN/MEMBER)',
          };
        }

        // Promove o MEMBER mais antigo a ADMIN e transfere a propriedade
        await this.prisma.$transaction(async (tx) => {
          await tx.boardMember.update({
            where: {
              boardId_userId: {
                boardId,
                userId: nextMember.userId,
              },
            },
            data: { role: 'ADMIN' },
          });

          await tx.board.update({
            where: { id: boardId },
            data: { ownerId: nextMember.userId },
          });

          await tx.boardMember.delete({
            where: {
              boardId_userId: {
                boardId,
                userId: memberUserId,
              },
            },
          });
        });

        const payload = {
          boardId,
          action: 'member_removed',
          memberUserId,
          by: requesterId,
          at: new Date().toISOString(),
        };
        this.boardGateway.emitModifiedInBoard(boardId, payload);

        return {
          message:
            'Propriedade transferida ao membro mais antigo (promovido a ADMIN) e usuário removido',
        };
      }

      // Há outro ADMIN: transferir propriedade e remover o dono atual
      await this.prisma.$transaction(async (tx) => {
        await tx.board.update({
          where: { id: boardId },
          data: { ownerId: nextAdmin.userId },
        });

        await tx.boardMember.delete({
          where: {
            boardId_userId: {
              boardId,
              userId: memberUserId,
            },
          },
        });
      });

      const payload = {
        boardId,
        action: 'member_removed',
        memberUserId,
        by: requesterId,
        at: new Date().toISOString(),
      };
      this.boardGateway.emitModifiedInBoard(boardId, payload);

      return {
        message:
          'Propriedade transferida ao ADMIN mais antigo e membro removido',
      };
    }

    // Alvo não é o dono: buscar o vínculo do alvo
    const targetMembership = await this.prisma.boardMember.findFirst({
      where: { boardId, userId: memberUserId },
    });
    if (!targetMembership) {
      throw new NotFoundException('Usuário não é membro deste quadro');
    }

    // Se está removendo outra pessoa, precisa ser ADMIN
    if (requesterId !== memberUserId) {
      const requesterMembership = await this.prisma.boardMember.findFirst({
        where: { boardId, userId: requesterId },
      });

      if (requesterMembership?.role !== 'ADMIN') {
        throw new NotFoundException(
          'Somente administradores podem remover outras pessoas',
        );
      }
    }

    // Auto-remoção de OBSERVER/MEMBER (e também ADMIN não-dono, permitido)
    await this.prisma.boardMember.delete({
      where: {
        boardId_userId: {
          boardId,
          userId: memberUserId,
        },
      },
    });

    const payload = {
      boardId,
      action: 'member_removed',
      memberUserId,
      by: requesterId,
      at: new Date().toISOString(),
    };
    this.boardGateway.emitModifiedInBoard(boardId, payload);

    return { message: 'Membro removido com sucesso' };
  }

  /**
   * Altera o cargo (role) de um membro do board.
   * Regras:
   * - Apenas ADMIN pode alterar.
   * - Não permite alterar o proprietário do quadro.
   * - Se o alvo for ADMIN e a nova role não for ADMIN, garantir que não é o único ADMIN restante.
   */
  async changeMemberRole(
    boardId: string,
    targetUserId: string,
    requesterId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const board = await this.findOne(boardId);

    if (targetUserId === board.ownerId) {
      throw new NotFoundException(
        'Não é possível alterar o cargo do proprietário do quadro',
      );
    }

    const targetMembership = await this.prisma.boardMember.findFirst({
      where: { boardId, userId: targetUserId },
    });
    if (!targetMembership) {
      throw new NotFoundException('Usuário não é membro deste quadro');
    }

    if (targetMembership.role === 'ADMIN' && dto.role !== 'ADMIN') {
      const adminCount = await this.prisma.boardMember.count({
        where: { boardId, role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        throw new NotFoundException(
          'Não é possível rebaixar o único ADMIN do quadro',
        );
      }
    }

    const updated = await this.prisma.boardMember.update({
      where: {
        boardId_userId: {
          boardId,
          userId: targetUserId,
        },
      },
      data: { role: dto.role },
    });

    const payload = {
      boardId,
      action: 'member_role_changed',
      memberUserId: targetUserId,
      newRole: dto.role,
      by: requesterId,
      at: new Date().toISOString(),
    } as const;
    this.boardGateway.emitModifiedInBoard(boardId, payload);

    return { message: 'Cargo alterado com sucesso', member: updated };
  }

  /**
   * Envia convite para um usuário participar do quadro.
   */
  async invite(boardId: string, senderId: string, dto: InviteBoardDto) {
    await this.findOne(boardId);

    const memberRole = await this.prisma.boardMember.findFirst({
      where: {
        boardId,
        userId: senderId,
      },
    });

    if (memberRole?.role !== 'ADMIN') {
      throw new NotFoundException(
        'Você não tem permissão para convidar usuários para este quadro',
      );
    }

    const recipient = await this.prisma.user.findUnique({
      where: { userName: dto.userName },
    });

    if (!recipient) {
      throw new NotFoundException('Destinatário não encontrado');
    }

    const existingInvite = await this.prisma.invite.findFirst({
      where: {
        boardId,
        recipientId: recipient.id,
      },
    });

    if (existingInvite) {
      throw new NotFoundException(
        'Já existe um convite pendente para este usuário',
      );
    }

    const isMember = await this.prisma.boardMember.findFirst({
      where: {
        boardId,
        userId: recipient.id,
      },
    });

    if (isMember) {
      throw new NotFoundException('Este usuário já é membro do quadro');
    }

    await this.prisma.invite.create({
      data: {
        boardId,
        senderId: senderId,
        recipientId: recipient.id,
        email: recipient.email,
        role: dto.role,
      },
    });

    this.notificationsGateway.sendNewNotificationToUser(recipient.id);

    return { message: 'Convite enviado com sucesso' };
  }

  /**
   * Processa a resposta de um convite para participar do quadro.
   */
  async responseInvite(
    boardId: string,
    recipientId: string,
    dto: ResponseInviteBoardDto,
  ) {
    const invite = await this.prisma.invite.findUnique({
      where: { id: dto.idInvite },
    });

    if (!invite) {
      throw new NotFoundException('Convite não encontrado');
    }

    if (invite.recipientId !== recipientId) {
      throw new NotFoundException(
        'Você não tem permissão para aceitar este convite',
      );
    }

    if (!dto.response) {
      await this.prisma.invite.delete({ where: { id: dto.idInvite } });
      return { message: 'Convite recusado com sucesso' };
    }

    await this.prisma.$transaction(async (prisma) => {
      await prisma.boardMember.create({
        data: {
          boardId,
          userId: recipientId,
          role: invite.role,
        },
      });

      await prisma.invite.delete({ where: { id: dto.idInvite } });
    });

    return { message: 'Convite aceito com sucesso' };
  }
}
