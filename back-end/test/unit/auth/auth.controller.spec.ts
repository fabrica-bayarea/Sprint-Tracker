import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { SignUpDto } from 'src/auth/dto/signup.dto';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;

  const mockResponse: Partial<Response> = {
    cookie: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  const mockAuthService = {
    signUp: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'NODE_ENV') return 'development';
      if (key === 'BASE_URL') return 'http://localhost';
      if (key === 'BASE_URL_UI') return 'http://localhost:3001';
      return null;
    }),
  };

  const mockJwtService = {
    verify: jest.fn(),
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    controller = module.get<AuthController>(AuthController);
  });
  describe('signUp', () => {
    it('deve retornar sucesso e definir cookie ao cadastrar usuário', async () => {
      const dto: SignUpDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
        userName: 'testuser',
      };

      mockAuthService.signUp.mockResolvedValueOnce({
        accessToken: 'fake-token',
      });

      await controller.signUp(dto, mockResponse as Response);

      expect(mockAuthService.signUp).toHaveBeenCalledWith(dto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'sprinttacker-session',
        'fake-token',
        expect.objectContaining({
          httpOnly: true,
        }),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuário cadastrado com sucesso',
      });
    });

    it('deve lançar BadRequestException se email ou senha forem ausentes', async () => {
      const dto = {
        email: '',
        password: '',
        name: 'Jhon Doe',
        userName: 'jhon_doe',
      };

      mockAuthService.signUp.mockRejectedValueOnce(
        new BadRequestException('E-mail já cadastrado'),
      );

      await expect(
        controller.signUp(dto, mockResponse as Response),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
