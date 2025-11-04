/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from 'src/profile/profile.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProfileDto } from 'src/profile/dto/update-profile.dto';
import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';

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
    it('should return the user profile', async () => {
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

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('1')).rejects.toThrow(
        'Usuário não encontrado',
      );
    });
  });

  describe('updateProfile', () => {
    it('must update and return the user profile', async () => {
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

    it('should throw error if update fails', async () => {
      mockPrisma.user.update.mockResolvedValue(null);

      await expect(
        service.updateProfile('1', {
          name: 'Test',
          userName: 'testuser',
          email: 'test@email.com',
        }),
      ).rejects.toThrow('Erro ao atualizar o perfil');
    });

    it('should throw an error if trying to update profile of external provider user', async () => {
      const userId = 'provider-user-1';
      const dto: ProfileDto = {
        name: 'Social User',
        userName: 'socialuser',
        email: 'social@email.com',
      };

      const userWithProvider = {
        id: userId,
        ...dto,
        providerId: 'google-oauth-123', // O campo que aciona o erro
      };

      mockPrisma.user.update.mockResolvedValue(userWithProvider);

      await expect(service.updateProfile(userId, dto)).rejects.toThrow(
        'Não é possível atualizar o email de um usuário cadastrado por provedor externo',
      );
      /*
      // Opcional: Verificar se o update do Prisma foi chamado antes do erro
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: dto,
      });
      */
    });
  });

  describe('deleteProfile', () => {
    it('must delete the user and all associated data', async () => {
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

      const result = await service.deleteProfile(userId);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Conta e dados associados excluídos com sucesso',
      });
    });

    it('should throw NotFoundException if the user does not exist', async () => {
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.deleteProfile('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
