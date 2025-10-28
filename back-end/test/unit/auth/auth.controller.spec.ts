
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

  const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
      ],

    }).setLogger(mockLogger).compile();

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
/*
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
  HttpStatus,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { SignUpDto } from 'src/auth/dto/signup.dto';
import { SignInDto } from 'src/auth/dto/signin.dto';
import { ForgotPasswordDto } from 'src/email/dto/forgot-password.dto';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';
import { VerifyResetCodeDto } from 'src/auth/dto/verify-reset-code.dto';

// --- Mocks de Serviços e Objetos ---

// Mock para o ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    switch (key) {
      case 'NODE_ENV':
        return 'development';
      case 'BASE_URL_UI':
        return 'http://localhost:3001';
      default:
        return null;
    }
  }),
};

// Mock para o AuthService
const mockAuthService = {
  signUp: jest.fn(),
  signIn: jest.fn(),
  signInWithProvider: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  verifyResetCode: jest.fn(),
  changePassword: jest.fn(),
};

// Mock para o objeto Response (Express)
const mockResponse = {
  cookie: jest.fn().mockReturnThis(),
  clearCookie: jest.fn().mockReturnThis(),
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  redirect: jest.fn().mockReturnThis(),
} as unknown as Response;

// Mock de Logger para evitar logs durante o teste e permitir espião
jest.spyOn(Logger, 'log').mockImplementation(() => {});
jest.spyOn(Logger, 'error').mockImplementation(() => {});
jest.spyOn(Logger, 'warn').mockImplementation(() => {});

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  // --- Testes para Propriedade Privada ---

  describe('get BASE_URL_UI', () => {
    it('should return BASE_URL_UI in development environment', () => {
      mockConfigService.get.mockImplementationOnce((key) =>
        key === 'NODE_ENV' ? 'development' : 'http://localhost:3001',
      );
      // @ts-ignore: Acessando getter privado para teste unitário
      const baseUrlUI = controller['BASE_URL_UI'];
      expect(baseUrlUI).toBe('http://localhost:3001');
    });

    it('should return BASE_URL in production environment', () => {
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'BASE_URL') return 'https://api.prod.com';
        return null;
      });
      // @ts-ignore
      const baseUrl = controller['BASE_URL_UI'];
      expect(baseUrl).toBe('https://api.prod.com');
    });
  });

  // --- Testes para signUp ---

  describe('signUp', () => {
    const dto: SignUpDto = {
      email: 'test@example.com',
      password: 'password',
      name: 'Test User',
    };
    const authResult = { accessToken: 'jwt-signup-token' };

    beforeEach(() => {
      mockAuthService.signUp.mockResolvedValue(authResult);
    });

    it('should call authService.signUp and set cookie on success', async () => {
      await controller.signUp(dto, mockResponse);

      expect(mockAuthService.signUp).toHaveBeenCalledWith(dto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'sprinttacker-session',
        authResult.accessToken,
        expect.any(Object), // Opções do cookie
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuário cadastrado com sucesso',
      });
    });

    it('should throw BadRequestException if email is empty', async () => {
      const invalidDto = { ...dto, email: ' ' };
      await expect(controller.signUp(invalidDto, mockResponse)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockAuthService.signUp).not.toHaveBeenCalled();
    });

    it('should rethrow HttpException from service layer', async () => {
      mockAuthService.signUp.mockRejectedValue(
        new BadRequestException('Email já em uso'),
      );
      await expect(controller.signUp(dto, mockResponse)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException for unknown errors', async () => {
      mockAuthService.signUp.mockRejectedValue(new Error('DB failure'));
      await expect(controller.signUp(dto, mockResponse)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // --- Testes para signIn ---

  describe('signIn', () => {
    const dto: SignInDto = {
      email: 'test@example.com',
      password: 'password',
      rememberMe: true,
    };
    const authResult = { accessToken: 'jwt-signin-token' };

    beforeEach(() => {
      mockAuthService.signIn.mockResolvedValue(authResult);
    });

    it('should call authService.signIn and set cookie on success', async () => {
      await controller.signIn(dto, mockResponse);

      expect(mockAuthService.signIn).toHaveBeenCalledWith(dto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'sprinttacker-session',
        authResult.accessToken,
        // Espera-se que as opções reflitam rememberMe: true
        expect.objectContaining({ httpOnly: true, expires: expect.any(Date) }),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuário autenticado com sucesso',
      });
    });

    it('should rethrow UnauthorizedException from service layer', async () => {
      mockAuthService.signIn.mockRejectedValue(
        new UnauthorizedException('Credenciais inválidas'),
      );
      await expect(controller.signIn(dto, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw InternalServerErrorException for unknown errors', async () => {
      mockAuthService.signIn.mockRejectedValue(new Error('Network error'));
      await expect(controller.signIn(dto, mockResponse)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // --- Testes para googleAuth e microsoftAuth (Guards) ---

  describe('googleAuth and microsoftAuth', () => {
    it('googleAuth should return nothing (handled by guard)', async () => {
      // O teste de unidade não executa Guards, apenas verifica o retorno
      const result = await controller.googleAuth();
      expect(result).toBeUndefined();
    });
    it('microsoftAuth should return nothing (handled by guard)', async () => {
      const result = await controller.microsoftAuth();
      expect(result).toBeUndefined();
    });
  });

  // --- Testes para googleAuthRedirect ---

  describe('googleAuthRedirect', () => {
    const mockReq = {
      user: {
        google_id: '12345',
        email: 'google@test.com',
        name: 'Google User',
        access_token: 'provider-token',
      },
    };
    const authResult = { accessToken: 'jwt-google-token' };

    it('should sign in with provider and redirect to dashboard on success', async () => {
      mockAuthService.signInWithProvider.mockResolvedValue(authResult);

      await controller.googleAuthRedirect(mockReq, mockResponse);

      expect(mockAuthService.signInWithProvider).toHaveBeenCalledWith(
        'google',
        {
          providerId: mockReq.user.google_id,
          email: mockReq.user.email,
          name: mockReq.user.name,
        },
      );
      expect(mockResponse.cookie).toHaveBeenCalled();
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3001/dashboard',
      );
    });

    it('should redirect to error page if user data is incomplete', async () => {
      const invalidReq = { user: { email: 'a', name: 'b' } }; // Falta google_id
      // @ts-ignore
      await controller.googleAuthRedirect(invalidReq, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3001/auth/error?message=incomplete_google_data',
      );
      expect(mockAuthService.signInWithProvider).not.toHaveBeenCalled();
    });

    it('should redirect to error page if token generation fails', async () => {
      mockAuthService.signInWithProvider.mockResolvedValue({
        accessToken: null,
      });
      await controller.googleAuthRedirect(mockReq, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3001/auth/error?message=google_login_failed',
      );
    });

    it('should redirect to error page on service error', async () => {
      mockAuthService.signInWithProvider.mockRejectedValue(
        new Error('Provider fail'),
      );
      await controller.googleAuthRedirect(mockReq, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3001/auth/error?message=google_login_failed',
      );
    });
  });

  // --- Testes para microsoftAuthRedirect ---

  describe('microsoftAuthRedirect', () => {
    const mockReq = {
      user: {
        microsoftId: 'ms-456',
        email: 'ms@test.com',
        name: 'MS User',
        access_token: 'provider-token',
      },
    };
    const authResult = { accessToken: 'jwt-ms-token' };

    it('should sign in with provider and redirect to dashboard on success', async () => {
      mockAuthService.signInWithProvider.mockResolvedValue(authResult);

      await controller.microsoftAuthRedirect(mockReq, mockResponse);

      expect(mockAuthService.signInWithProvider).toHaveBeenCalledWith(
        'microsoft',
        {
          providerId: mockReq.user.microsoftId,
          email: mockReq.user.email,
          name: mockReq.user.name,
        },
      );
      expect(mockResponse.cookie).toHaveBeenCalled();
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3001/dashboard',
      );
    });

    it('should redirect to error page if user data is incomplete', async () => {
      const invalidReq = { user: { email: 'a', name: 'b' } }; // Falta microsoftId
      // @ts-ignore
      await controller.microsoftAuthRedirect(invalidReq, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:3001/auth/error?message=incomplete_microsoft_data',
      );
    });
  });

  // --- Testes para forgotPassword ---

  describe('forgotPassword', () => {
    const dto: ForgotPasswordDto = { email: 'forgot@test.com' };

    it('should call authService.forgotPassword and return success message', async () => {
      mockAuthService.forgotPassword.mockResolvedValue(undefined);
      const result = await controller.forgotPassword(dto);

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('message');
    });

    it('should rethrow BadRequestException from service layer', async () => {
      mockAuthService.forgotPassword.mockRejectedValue(
        new BadRequestException('Email inválido'),
      );
      await expect(controller.forgotPassword(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException for unknown errors', async () => {
      mockAuthService.forgotPassword.mockRejectedValue(new Error('SMTP error'));
      await expect(controller.forgotPassword(dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // --- Testes para verifyResetCode ---

  describe('verifyResetCode', () => {
    const dto: VerifyResetCodeDto = {
      email: 'reset@test.com',
      code: '123456',
    };
    const resetJwtToken = 'reset-jwt-token';

    it('should call verifyResetCode and set reset-token cookie', async () => {
      mockAuthService.verifyResetCode.mockResolvedValue(resetJwtToken);
      const result = await controller.verifyResetCode(dto, mockResponse);

      expect(mockAuthService.verifyResetCode).toHaveBeenCalledWith(dto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'reset-token',
        resetJwtToken,
        expect.objectContaining({ httpOnly: true, path: '/v1/auth/reset-password' }),
      );
      expect(result).toHaveProperty('message');
    });

    it('should rethrow UnauthorizedException from service layer', async () => {
      mockAuthService.verifyResetCode.mockRejectedValue(
        new UnauthorizedException('Código inválido'),
      );
      await expect(
        controller.verifyResetCode(dto, mockResponse),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw InternalServerErrorException for unknown errors', async () => {
      mockAuthService.verifyResetCode.mockRejectedValue(new Error('JWT error'));
      await expect(
        controller.verifyResetCode(dto, mockResponse),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // --- Testes para resetPassword ---

  describe('resetPassword', () => {
    const mockReq = { user: { userId: 'user-reset-1' } };
    const dto = { newPassword: 'new-secure-password' };
    const mockToken = 'jwt-reset-token';

    it('should call authService.resetPassword and return success message', async () => {
      mockAuthService.resetPassword.mockResolvedValue(undefined);

      // @ts-ignore
      const result = await controller.resetPassword(mockToken, dto, mockReq);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        mockReq.user.userId,
        dto.newPassword,
      );
      expect(result).toEqual({ message: 'Senha redefinida com sucesso!' });
    });
    // Note: O ResetPasswordGuard é mockado/ignorado em testes de unidade.
    // Falhas de Unauthorized são tratadas pelo Guard.
  });

  // --- Testes para changePassword ---

  describe('changePassword', () => {
    const mockReq = { user: { id: 'user-change-1' } };
    const dto: ChangePasswordDto = {
      currentPassword: 'old',
      newPassword: 'new',
    };

    it('should call authService.changePassword and return success message', async () => {
      mockAuthService.changePassword.mockResolvedValue(undefined);

      // @ts-ignore
      const result = await controller.changePassword(mockReq, dto);

      expect(mockAuthService.changePassword).toHaveBeenCalledWith(
        mockReq.user.id,
        dto,
      );
      expect(result).toEqual({ message: 'Senha alterada com sucesso' });
    });

    it('should rethrow UnauthorizedException on invalid current password', async () => {
      mockAuthService.changePassword.mockRejectedValue(
        new UnauthorizedException('Senha atual incorreta'),
      );
      // @ts-ignore
      await expect(controller.changePassword(mockReq, dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw InternalServerErrorException for unknown errors', async () => {
      mockAuthService.changePassword.mockRejectedValue(
        new Error('Encryption failure'),
      );
      // @ts-ignore
      await expect(controller.changePassword(mockReq, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // --- Testes para logout ---

  describe('logout', () => {
    it('should clear the session cookie and return success message', async () => {
      // Configuramos o NODE_ENV para 'production' para testar o 'secure: true'
      mockConfigService.get.mockImplementation((key) =>
        key === 'NODE_ENV' ? 'production' : 'http://localhost:3001',
      );

      await controller.logout(mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'sprinttacker-session',
        expect.objectContaining({
          httpOnly: true,
          path: '/',
          secure: true, // Verifica se secure: true foi usado em produção
          sameSite: 'lax',
        }),
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Logout realizado com sucesso',
      });

      // Volta o mock de NODE_ENV
      mockConfigService.get.mockImplementation((key) =>
        key === 'NODE_ENV' ? 'development' : 'http://localhost:3001',
      );
    });

    /*
    it('should throw InternalServerErrorException on unknown error', async () => {
      // Simula uma falha na chamada do clearCookie
      mockResponse.clearCookie.mockImplementation(() => {
        throw new Error('Cookie fail');
      });

      await expect(controller.logout(mockResponse)).rejects.toThrow(
        InternalServerErrorException,
      );

      // Reverter o mock após a falha
      mockResponse.clearCookie.mockReturnThis();
    });
    
  });
});
*/