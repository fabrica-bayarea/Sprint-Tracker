/* eslint-disable @typescript-eslint/unbound-method */
import { randomBytes } from 'crypto';

import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import * as argon2 from 'argon2';

// Importar os serviços e DTOs reais
import { AuthService } from '@/auth/auth.service';
import { ChangePasswordDto } from '@/auth/dto/change-password.dto';
import { SignInDto } from '@/auth/dto/signin.dto';
import { SignUpDto } from '@/auth/dto/signup.dto';
import { VerifyResetCodeDto } from '@/auth/dto/verify-reset-code.dto';
import { ForgotPasswordDto } from '@/email/dto/forgot-password.dto';
import { EmailService } from '@/email/email.service';
import { PrismaService } from '@/prisma/prisma.service';

const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'JWT_SECRET') return 'test_jwt_secret';
    if (key === 'JWT_RESET_SECRET') return 'test_jwt_reset_secret';
    return undefined;
  }),
};

const mockEmailService = {
  sendForgotPasswordEmail: jest.fn(),
};

jest.mock('argon2', () => ({
  hash: jest.fn((password: string) => Promise.resolve(`hashed_${password}`)),
  verify: jest.fn((hash: string, password: string) =>
    Promise.resolve(hash === `hashed_${password}`),
  ),
  argon2id: 'argon2id',
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn((encoding: string) => {
      if (encoding === 'base64') return 'mockedBase64Code';
      if (encoding === 'hex') return 'mockedHexCode';
      return 'mockedCode';
    }),
  })),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    emailService = module.get(EmailService);

    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  // --- Testes para signUp ---
  describe('signUp', () => {
    const signUpDto: SignUpDto = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User',
      userName: 'newuser',
    };
    const mockUser = {
      id: 'user1',
      email: signUpDto.email,
      name: signUpDto.name,
      userName: 'newuser',
      passwordHash: 'hashed_password123',
      providerId: null,
      role: 'ADMIN',
      authProvider: 'local',
      createdAt: new Date(),
      updatedAt: new Date(),
      resetToken: null,
      resetTokenExpiresAt: null,
    };

    it('deve criar um novo usuário e retornar um token de acesso', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('mockAccessToken');

      const result = await service.signUp(signUpDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: signUpDto.email },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toEqual({ accessToken: 'mockAccessToken' });
    });

    it('deve lançar ConflictException se o email já existir', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        new ConflictException('Email ou nome de usuário já estão em uso'),
      );
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: signUpDto.email },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if userName already exists', async () => {
      const userByUserName = {
        id: 'user-diff-email',
        email: 'other@example.com',
        name: signUpDto.name,
        userName: signUpDto.userName,
        passwordHash: 'hashed_password_other',
        authProvider: 'local',
      };

      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(userByUserName);

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        new ConflictException('Email ou nome de usuário já estão em uso'),
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: signUpDto.email },
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { userName: signUpDto.userName },
      });

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException for Prisma P2002 error (unique constraint)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockRejectedValue(
        new PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
          meta: { target: ['userName'] },
        }),
      );

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        new ConflictException('Email ou nome de usuário já estão em uso'),
      );
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for PrismaClientValidationError (invalid input)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockRejectedValue(
        new PrismaClientValidationError(
          'Required field missing or invalid type.',
          {
            clientVersion: 'test',
          },
        ),
      );

      const consoleErrorSpy: jest.SpyInstance = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        new BadRequestException('Dados de entrada inválidos fornecidos.'),
      );

      // 4. Verificações:
      expect(prisma.user.create).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'PrismaClientValidationError:',
        'Required field missing or invalid type.',
      );

      consoleErrorSpy.mockRestore();
    });

    it('should throw BadRequestException for other errors during user creation', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockRejectedValue(
        new Error('Some other database error'),
      );

      await expect(service.signUp(signUpDto)).rejects.toThrow(
        new BadRequestException('Erro ao criar usuário'),
      );
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    const signInDto: SignInDto = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    };
    const mockUser = {
      id: 'user1',
      email: signInDto.email,
      name: 'Test User',
      userName: 'testuser',
      passwordHash: 'hashed_password123',
      authProvider: 'local',
      createdAt: new Date(),
      updatedAt: new Date(),
      resetToken: null,
      resetTokenExpiresAt: null,
    };

    it('deve retornar um token de acesso para credenciais válidas', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('mockAccessToken');

      const result = await service.signIn(signInDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: signInDto.email },
      });
      expect(argon2.verify).toHaveBeenCalledWith(
        mockUser.passwordHash,
        signInDto.password,
      );
      expect(result).toEqual({ accessToken: 'mockAccessToken' });
    });

    it('deve lançar UnauthorizedException se o usuário não for encontrado ou a senha for inválida', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.signIn(signInDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);
      await expect(service.signIn(signInDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );
    });
  });

  describe('signInWithProvider', () => {
    const provider = 'google';
    const req = {
      providerId: 'google123',
      email: 'google@example.com',
      name: 'Google User',
    };
    const mockUser = {
      id: 'user2',
      email: req.email,
      name: req.name,
      userName: 'googleuser',
      passwordHash: req.providerId,
      authProvider: provider,
      createdAt: new Date(),
      updatedAt: new Date(),
      resetToken: null,
      resetTokenExpiresAt: null,
    };

    it('deve criar ou encontrar o usuário e retornar um token de acesso', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock).mockReturnValue('mockAccessToken');

      const result = await service.signInWithProvider(provider, req);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: req.email },
      });
      expect(result).toEqual({ accessToken: 'mockAccessToken' });
    });

    it('deve lançar ForbiddenException se o email não for fornecido na requisição', async () => {
      const invalidReq = {
        providerId: 'google123',
        email: '',
        name: 'Invalid User',
      };
      await expect(
        service.signInWithProvider(provider, invalidReq),
      ).rejects.toThrow(new ForbiddenException(`No user from ${provider}`));
    });

    it('should find an existing user and return an access token', async () => {
      const provider = 'google';
      const req = {
        providerId: 'google123',
        email: 'existing@example.com',
        name: 'Existing User',
      };
      const existingUser = {
        id: 'user2',
        email: req.email,
        name: req.name,
        userName: 'existinguser',
        passwordHash: 'hashed_password',
        authProvider: provider,
        createdAt: new Date(),
        updatedAt: new Date(),
        resetToken: null,
        resetTokenExpiresAt: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
      //(prisma.user.create as jest.Mock).not.toHaveBeenCalled();
      (jwtService.sign as jest.Mock).mockReturnValue(
        'mockAccessTokenForExisting',
      );

      const result = await service.signInWithProvider(provider, req);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: req.email },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toEqual({ accessToken: 'mockAccessTokenForExisting' });
    });
  });

  describe('forgotPassword', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'forgot@example.com',
    };
    const mockUser = {
      id: 'user3',
      email: forgotPasswordDto.email,
      name: 'Forgot User',
      userName: 'forgotuser',
      passwordHash: 'hashed_password',
      authProvider: 'local',
      createdAt: new Date(),
      updatedAt: new Date(),
      resetToken: null,
      resetTokenExpiresAt: null,
    };

    it('deve enviar um e-mail de redefinição de senha e atualizar o token do usuário', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        resetToken: 'mockedBase64Code',
        resetTokenExpiresAt: new Date(),
      });
      (emailService.sendForgotPasswordEmail as jest.Mock).mockResolvedValue(
        undefined,
      );
      (randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn(() => 'mockedBase64Code'),
      });

      await service.forgotPassword(forgotPasswordDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: forgotPasswordDto.email },
      });
      expect(emailService.sendForgotPasswordEmail).toHaveBeenCalledWith(
        forgotPasswordDto.email,
        'mockedBase64Code',
      );
      expect(prisma.user.update).toHaveBeenCalled(); // Garante que o update foi chamado
    });

    it('deve retornar sem erro se o e-mail não for encontrado (boas práticas de segurança)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.forgotPassword(forgotPasswordDto),
      ).resolves.toBeUndefined();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: forgotPasswordDto.email },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(emailService.sendForgotPasswordEmail).not.toHaveBeenCalled();
    });

    it('deve lançar InternalServerErrorException se o envio do e-mail falhar', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        resetToken: 'mockedBase64Code',
        resetTokenExpiresAt: new Date(),
      });
      (emailService.sendForgotPasswordEmail as jest.Mock).mockRejectedValue(
        new Error(
          'Erro ao enviar o e-mail de recuperação. Detalhes: Error: Email service error',
        ),
      );

      await expect(service.forgotPassword(forgotPasswordDto)).rejects.toThrow(
        new InternalServerErrorException(
          'Erro ao enviar o e-mail de recuperação. Detalhes: Error: Email service error',
        ),
      );
      expect(emailService.sendForgotPasswordEmail).toHaveBeenCalled();
    });
  });

  describe('verifyResetCode', () => {
    const verifyResetCodeDto: VerifyResetCodeDto = {
      code: 'validCode',
    };
    const mockUser = {
      id: 'user4',
      email: 'verifyResetCode@email.com',
      name: 'Verify User',
      userName: 'verifyuser',
      passwordHash: 'hashed_password',
      authProvider: 'local',
      createdAt: new Date(),
      updatedAt: new Date(),
      resetToken: verifyResetCodeDto.code,
      resetTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 5),
    };

    it('deve retornar um token JWT para um código válido', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        resetToken: null,
        resetTokenExpiresAt: null,
      });
      (jwtService.sign as jest.Mock).mockReturnValue('mockResetJwtToken');
      (configService.get as jest.Mock).mockReturnValue('test_jwt_reset_secret');

      const result = await service.verifyResetCode(verifyResetCodeDto);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { resetToken: verifyResetCodeDto.code },
      });
      expect(result).toBe('mockResetJwtToken');
    });

    it('deve lançar ForbiddenException se o código não for encontrado ou for inválido', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(service.verifyResetCode(verifyResetCodeDto)).rejects.toThrow(
        new ForbiddenException('Código inválido ou expirado.'),
      );

      const userWithWrongCode = { ...mockUser, resetToken: 'wrongCode' };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(userWithWrongCode);
      await expect(service.verifyResetCode(verifyResetCodeDto)).rejects.toThrow(
        new UnauthorizedException('Código de verificação inválido.'),
      );
    });

    it('deve lançar UnauthorizedException se o código estiver expirado', async () => {
      const userWithExpiredCode = {
        ...mockUser,
        resetTokenExpiresAt: new Date(Date.now() - 1000 * 60 * 5),
      };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(
        userWithExpiredCode,
      );
      (prisma.user.update as jest.Mock).mockResolvedValue(userWithExpiredCode);

      await expect(service.verifyResetCode(verifyResetCodeDto)).rejects.toThrow(
        new UnauthorizedException('Código de verificação expirado.'),
      );
    });
  });

  describe('resetPassword', () => {
    const userId = 'someUserId';
    const newPassword = 'newStrongPassword123';
    const mockUser = {
      id: userId,
      email: 'user@example.com',
      passwordHash: 'oldHashedPassword',
    };

    it('deve hashear e atualizar a senha do usuário', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue(
        'hashed_newStrongPassword123',
      );

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      await service.resetPassword(userId, newPassword);

      expect(argon2.hash).toHaveBeenCalledWith(newPassword, expect.any(Object));
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: 'hashed_newStrongPassword123' },
      });
    });

    it('deve lançar BadRequestException em erro de atualização', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue(
        'hashed_newStrongPassword123',
      );

      (prisma.user.update as jest.Mock).mockRejectedValue(
        new Error('DB update failed'),
      );

      await expect(service.resetPassword(userId, newPassword)).rejects.toThrow(
        new BadRequestException(
          'Erro ao redefinir a senha: Error: DB update failed',
        ),
      );
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const userId = 'userToChangePassword';
    const changePasswordDto: ChangePasswordDto = {
      oldPassword: 'oldPassword123',
      newPassword: 'newPassword456',
      confirmNewPassword: 'newPassword456',
    };
    const mockUser = {
      id: userId,
      email: 'change@example.com',
      passwordHash: 'hashed_oldPassword123',
      authProvider: 'local',
    };

    it('should throw BadRequestException if user is not found', async () => {
      const userId = 'non-existent-user';
      const changePasswordDto: ChangePasswordDto = {
        oldPassword: 'anyPassword',
        newPassword: 'newPassword456',
        confirmNewPassword: 'newPassword456',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.changePassword(userId, changePasswordDto),
      ).rejects.toThrow(new BadRequestException('Usuário não encontrado.'));

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(argon2.verify).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should change the user password successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (argon2.hash as jest.Mock).mockResolvedValue('hashed_newPassword456');
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash: 'hashed_newPassword456',
      });

      await service.changePassword(userId, changePasswordDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(argon2.verify).toHaveBeenCalledWith(
        mockUser.passwordHash,
        changePasswordDto.oldPassword,
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: 'hashed_newPassword456' },
      });
    });

    it('deve lançar BadRequestException se a senha antiga estiver incorreta', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(userId, changePasswordDto),
      ).rejects.toThrow(new BadRequestException('Senha antiga incorreta.'));
    });
  });
});
