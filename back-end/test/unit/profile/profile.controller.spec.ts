import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from '../../../src/profile/profile.controller';
import { ProfileService } from '../../../src/profile/profile.service';
import { ProfileDto } from '../../../src/profile/dto/update-profile.dto';
import { AuthenticatedUser } from '../../../src/types/user.interface';

describe('ProfileController', () => {
  let controller: ProfileController;

  const mockProfileService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
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
    it('should return the user profile', async () => {
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
    it('should update the user profile and return a success message', async () => {
      const dto: ProfileDto = {
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
    it('should delete the user profile and return a success message', async () => {
      mockProfileService.deleteProfile.mockResolvedValue({});

      const result = await controller.deleteProfile(mockUser);

      expect(mockProfileService.deleteProfile).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ message: 'Conta deletada com sucesso.' });
    });
  });
});
