import { Test, TestingModule } from '@nestjs/testing';

import { updateProfileDto } from '@/me/dto/update-profile.dto';
import { ProfileController } from '@/me/me.controller';
import { ProfileService } from '@/me/me.service';
import { AuthenticatedUser } from '@/types/user.interface';

describe('ProfileController', () => {
  let controller: ProfileController;

  const mockProfileService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteAccount: jest.fn(),
  };

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    userName: 'testuser',
    role: 'ADMIN',
    authProvider: 'local',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('deve retornar o perfil do usuário', async () => {
      const mockProfile = {
        name: 'João',
        userName: 'joaosilva',
        email: 'joao@email.com',
      };

      mockProfileService.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getUserProfile(mockUser);

      expect(mockProfileService.getProfile).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('deve atualizar o perfil do usuário e retornar uma mensagem de sucesso', async () => {
      const dto: updateProfileDto = {
        name: 'João Atualizado',
        userName: 'joaoupdated',
        email: 'joao@novo.com',
      };

      mockProfileService.updateProfile.mockResolvedValue(dto);

      const result = await controller.updateProfile(mockUser, dto);

      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
        'user-123',
        dto,
      );
      expect(result).toEqual({
        message: 'Perfil atualizado com sucesso.',
        data: dto,
      });
    });
  });

  describe('deleteProfile', () => {
    it('deve deletar o perfil do usuário e retornar uma mensagem de sucesso', async () => {
      mockProfileService.deleteAccount.mockResolvedValue({});

      const result = await controller.deleteAccount(mockUser);

      expect(mockProfileService.deleteAccount).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ message: 'Conta deletada com sucesso.' });
    });
  });
});
