import { Injectable, NotFoundException } from '@nestjs/common';

import { BoardGateway } from '@/events/board.gateway';
import { NotificationsGateway } from '@/events/notification.gateway';
import { PrismaService } from '@/prisma/prisma.service';

import { CreateBoardDto } from './dto/create-board.dto';
import { InviteBoardDto } from './dto/invite-to-board.dto';
import { ResponseInviteBoardDto } from './dto/response-invite.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

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
  findAll(idUser: string) {
    return this.prisma.board.findMany({
      where: { members: { some: { userId: idUser } }, isArchived: false },
      include: {
        lists: {
          include: {
            tasks: true,
          },
        },
      },
    });
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
   * Busca um quadro pelo ID verificando se o usuário tem acesso.
   */
  async getBoardById(boardId: string, userId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!board) throw new NotFoundException('Quadro não encontrado');
    if (board.members.length === 0) {
      throw new NotFoundException('Você não tem acesso a este quadro');
    }

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
    return this.prisma.board.delete({ where: { id: boardId } });
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
