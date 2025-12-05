import { HttpException, Injectable, NotFoundException, HttpStatus } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { updateProfileDto } from './dto/update-profile.dto';
import { AuthProvider } from '@prisma/client';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) { }

  async getProfile(userId: string) {
    const profile = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      throw new Error('Usuário não encontrado');
    }

    const userData = {
      id: profile.id,
      name: profile.name,
      userName: profile.userName,
      email: profile.email,
      authProvider: profile.authProvider
    };

    return userData;
  }

  async updateProfile(userId: string, data: updateProfileDto) {
    if (data.email) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (user?.authProvider !== AuthProvider.local) {
        throw new HttpException(
          'Não é possível atualizar o email de um usuário cadastrado por provedor externo',
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      }
    }

    const updatedProfile = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    if (!updatedProfile) {
      throw new Error('Erro ao atualizar o perfil');
    }

    return updatedProfile;
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.task.deleteMany({
        where: {
          list: {
            board: {
              ownerId: userId,
            },
          },
        },
      });

      await tx.list.deleteMany({
        where: {
          board: {
            ownerId: userId,
          },
        },
      });

      await tx.boardMember.deleteMany({
        where: {
          userId: userId,
        },
      });

      await tx.board.deleteMany({
        where: {
          ownerId: userId,
        },
      });

      await tx.user.delete({
        where: { id: userId },
      });
    });

    return { message: 'Conta e dados associados excluídos com sucesso' };
  }

  async getNotifications(userId: string) {
    const notifications = await this.prisma.invite.findMany({
      where: { recipientId: userId },
      select: {
        id: true,
        createdAt: true,
        statusInvite: true,
        role: true,
        sender: {
          select: {
            id: true,
            name: true,
            userName: true,
          },
        },
        board: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notifications;
  }
}
