/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { Test, TestingModule } from '@nestjs/testing';

import { ProfileDto } from '@/me/dto/update-profile.dto';
import { ProfileService } from '@/me/me.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('ProfileService', () => {
  let service: ProfileService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('deve retornar o perfil do usuário', async () => {
      const mockUser = {
        id: '1',
        name: 'João',
        userName: 'joao123',
        email: 'joao@email.com',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('1');
      expect(result).toEqual({
        name: mockUser.name,
        userName: mockUser.userName,
        email: mockUser.email,
      });
    });

    it('deve lançar erro se o usuário não for encontrado', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('1')).rejects.toThrow(
        'Usuário não encontrado',
      );
    });
  });

  describe('updateProfile', () => {
    it('deve atualizar e retornar o perfil do usuário', async () => {
      const dto: ProfileDto = {
        name: 'Novo Nome',
        userName: 'novoUser',
        email: 'novo@email.com',
      };

      const updatedUser = { id: '1', ...dto };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('1', dto);
      expect(result).toEqual(updatedUser);
    });

    it('deve lançar erro se a atualização falhar', async () => {
      mockPrisma.user.update.mockResolvedValue(null);

      await expect(
        service.updateProfile('1', {
          name: 'Test',
          userName: 'testuser',
          email: 'test@email.com',
        }),
      ).rejects.toThrow('Erro ao atualizar o perfil');
    });
  });

  describe('deleteProfile', () => {
    it('deve deletar o usuário e todos os dados associados', async () => {
      const userId = 'user-123';

      const mockTransaction = jest.fn(async (callback: any) => {
        return callback({
          task: { deleteMany: jest.fn() },
          list: { deleteMany: jest.fn() },
          boardMember: { deleteMany: jest.fn() },
          board: { deleteMany: jest.fn() },
          user: { delete: jest.fn() },
        });
      });

      mockPrisma.user.findUnique = jest
        .fn()
        .mockResolvedValue({ id: userId }) as any;
      mockPrisma.$transaction = mockTransaction;

      const result = await service.deleteAccount(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Conta e dados associados excluídos com sucesso',
      });
    });

    it('deve lançar NotFoundException se o usuário não existir', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.deleteAccount('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
