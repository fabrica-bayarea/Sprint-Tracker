import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import cookieParser from 'cookie-parser';
import * as jwt from 'jsonwebtoken';

import { AppModule } from '@/app.module';
import { EmailService } from '@/email/email.service';
import { PrismaService } from '@/prisma/prisma.service';

import {
  createTestUser,
  performSignUp,
  performSignIn,
  initiateForgotPassword,
  getResetCodeFromDb,
  performVerifyResetCode,
  performResetPassword,
  performChangePassword,
  extractCookie,
  extractTokenFromCookie,
} from './auth.helpers';

process.env.JWT_SECRET = 'e2e_test_jwt_secret';
process.env.JWT_RESET_SECRET = 'e2e_test_jwt_reset_secret';
process.env.EMAIL = 'test@example.com';
process.env.PASS = 'testpassword';

const mockEmailService = {
  sendForgotPasswordEmail: jest.fn(),
};

describe('Autenticação (e2e) - Fluxo Completo', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const cleanDatabase = async () => {
    try {
      if (prismaService) {
        await prismaService.user.deleteMany();
      }
    } catch (error) {
      console.error('Erro ao limpar o banco de dados de teste:', error);
      throw error;
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue(mockEmailService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.enableCors({
      origin: true,
      credentials: true,
    });
    app.setGlobalPrefix('v1');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase();
    mockEmailService.sendForgotPasswordEmail.mockClear();
  });

  afterAll(async () => {
    await cleanDatabase();
    await app.close();
  });

  describe('Fluxo de Cadastro', () => {
    it('/v1/auth/signup (POST) - deve registrar um novo usuário e definir cookie sprinttacker-session', async () => {
      const signUpDto = {
        email: 'newuser@example.com',
        password: 'StrongPassword123!',
        name: 'New User',
        userName: 'newuser',
      };

      const response = await performSignUp(app, signUpDto).expect(201);

      const sessionCookie = extractCookie(response, 'sprinttacker-session');
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toMatch(/^sprinttacker-session=/);
      expect(sessionCookie).toContain('HttpOnly');
      expect(sessionCookie).toContain('Path=/');

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe('Usuário cadastrado com sucesso');

      const createdUser = await prismaService.user.findUnique({
        where: { email: signUpDto.email },
      });
      expect(createdUser).toBeDefined();
      expect(createdUser?.email).toBe(signUpDto.email);
      expect(createdUser?.userName).toBe(signUpDto.userName);
    });
  });

  describe('Fluxo de Login', () => {
    const userEmail = 'testlogin@example.com';
    const userPassword = 'TestPassword123!';
    const userName = 'testloginuser';

    beforeEach(async () => {
      await createTestUser(
        prismaService,
        userEmail,
        userPassword,
        userName,
        'Test Login User',
        Role.ADMIN,
      );
    });

    it('/v1/auth/signin (POST) - deve fazer login de um usuário com credenciais válidas e definir cookie sprinttacker-session', async () => {
      const signInDto = {
        email: userEmail,
        password: userPassword,
        rememberMe: false,
      };

      const response = await performSignIn(app, signInDto).expect(200);

      const sessionCookie = extractCookie(response, 'sprinttacker-session');
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toMatch(/^sprinttacker-session=/);
      expect(sessionCookie).toContain('HttpOnly');
      expect(sessionCookie).toContain('Path=/');

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe('Usuário autenticado com sucesso');
    });
  });

  describe('Fluxo de Esqueci a Senha', () => {
    const userEmail = 'forgotpass@example.com';
    const userPassword = 'ForgotPass123!';
    const userName = 'forgotpassuser';

    beforeEach(async () => {
      await createTestUser(
        prismaService,
        userEmail,
        userPassword,
        userName,
        'Forgot Pass User',
        Role.ADMIN,
      );
      mockEmailService.sendForgotPasswordEmail.mockClear();
    });

    it('/v1/auth/forgot-password (PATCH) - deve retornar 200 OK e enviar email se o usuário existir', async () => {
      const forgotPasswordDto = { email: userEmail };

      const response = await initiateForgotPassword(
        app,
        forgotPasswordDto,
      ).expect(200);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe(
        'Se o email estiver cadastrado, as instruções para recuperação de senha foram enviadas.',
      );

      expect(mockEmailService.sendForgotPasswordEmail).toHaveBeenCalledTimes(1);
      expect(mockEmailService.sendForgotPasswordEmail).toHaveBeenCalledWith(
        userEmail,
        expect.any(String),
      );

      const userInDb = await prismaService.user.findUnique({
        where: { email: userEmail },
      });
      expect(userInDb?.resetToken).toBeDefined();
      expect(userInDb?.resetTokenExpiresAt).toBeDefined();
    });
  });

  describe('Fluxo de Verificação de Código de Redefinição', () => {
    const userEmail = 'verifycode@example.com';
    const userPassword = 'VerifyCode123!';
    const userName = 'verifycodeuser';
    let generatedResetCode: string;

    beforeEach(async () => {
      await createTestUser(
        prismaService,
        userEmail,
        userPassword,
        userName,
        'Verify Code User',
        Role.ADMIN,
      );

      await initiateForgotPassword(app, { email: userEmail }).expect(200);

      generatedResetCode = await getResetCodeFromDb(prismaService, userEmail);
      expect(generatedResetCode).toBeDefined();
    });

    it('/v1/auth/verify-reset-code (POST) - deve retornar 200 OK e definir cookie reset-token para código válido', async () => {
      const verifyResetCodeDto = { code: generatedResetCode };

      const response = await performVerifyResetCode(
        app,
        verifyResetCodeDto,
      ).expect(200);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe(
        'Código verificado com sucesso. Você pode redefinir sua senha.',
      );

      const resetTokenCookie = extractCookie(response, 'reset-token');
      expect(resetTokenCookie).toBeDefined();
      expect(resetTokenCookie).toMatch(/^reset-token=/);
      expect(resetTokenCookie).toContain('HttpOnly');
      expect(resetTokenCookie).toContain('Path=/v1/auth/reset-password');

      const resetTokenCookieValue = extractTokenFromCookie(
        resetTokenCookie as string,
      );
      const decodedToken: unknown = jwt.verify(
        resetTokenCookieValue as string,
        process.env.JWT_RESET_SECRET as string,
      );
      expect(decodedToken).toHaveProperty('userId');
      expect(decodedToken).toHaveProperty('email', userEmail);
      expect(decodedToken).toHaveProperty('purpose', 'reset-password');
    });
  });

  describe('Fluxo de Redefinição de Senha', () => {
    const userEmail = 'resetpass@example.com';
    const userPassword = 'OldPassword123!';
    const userName = 'resetpassuser';
    let resetTokenCookie: string;

    beforeEach(async () => {
      await cleanDatabase();
      await createTestUser(
        prismaService,
        userEmail,
        userPassword,
        userName,
        'Reset Pass User',
        Role.ADMIN,
      );

      await initiateForgotPassword(app, { email: userEmail }).expect(200);

      const generatedResetCode = await getResetCodeFromDb(
        prismaService,
        userEmail,
      );
      expect(generatedResetCode).toBeDefined();

      const verifyResponse = await performVerifyResetCode(app, {
        code: generatedResetCode,
      }).expect(200);

      resetTokenCookie =
        (extractCookie(verifyResponse, 'reset-token') as string) ||
        (extractCookie(verifyResponse, 'reset-token') as string) ||
        ((verifyResponse.body as { resetToken?: string })?.resetToken
          ? `reset-token=${(verifyResponse.body as { resetToken: string }).resetToken}`
          : '');
      expect(resetTokenCookie).toBeDefined();
    });

    it('/v1/auth/reset-password (POST) - deve redefinir senha com cookie reset-token válido', async () => {
      const newPassword = 'NewStrongPassword456!';
      const resetPasswordDto = {
        newPassword: newPassword,
        confirmNewPassword: newPassword,
      };

      const response = await performResetPassword(
        app,
        resetPasswordDto,
        resetTokenCookie,
      ).expect(200);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe('Senha redefinida com sucesso!');

      const signInDto = {
        email: userEmail,
        password: newPassword,
        rememberMe: false,
      };
      const loginResponse = await performSignIn(app, signInDto).expect(200);

      const sessionCookie = extractCookie(
        loginResponse,
        'sprinttacker-session',
      );
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toMatch(/^sprinttacker-session=/);

      const userInDbAfterReset = await prismaService.user.findUnique({
        where: { email: userEmail },
      });
      expect(userInDbAfterReset?.resetToken).toBeNull();
      expect(userInDbAfterReset?.resetTokenExpiresAt).toBeNull();
    });
  });

  describe('Fluxo de Alteração de Senha', () => {
    const userEmail = 'changepass@example.com';
    const oldPassword = 'OldPassword123!';
    const newPassword = 'NewPassword456!';
    const userName = 'changepassuser';
    let sessionCookie: string;

    beforeEach(async () => {
      await cleanDatabase();
      await createTestUser(
        prismaService,
        userEmail,
        oldPassword,
        userName,
        'Change Pass User',
        Role.ADMIN,
      );

      const signInDto = {
        email: userEmail,
        password: oldPassword,
        rememberMe: false,
      };
      const loginResponse = await performSignIn(app, signInDto).expect(200);

      sessionCookie = extractCookie(
        loginResponse,
        'sprinttacker-session',
      ) as string;
      expect(sessionCookie).toBeDefined();
    });

    it('/v1/auth/change-password (PUT) - deve alterar senha do usuário com senha antiga válida', async () => {
      const changePasswordDto = {
        oldPassword: oldPassword,
        newPassword: newPassword,
        confirmNewPassword: newPassword,
      };

      const response = await performChangePassword(
        app,
        changePasswordDto,
        sessionCookie,
      ).expect(200);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe('Senha alterada com sucesso');

      const loginWithNewPassResponse = await performSignIn(app, {
        email: userEmail,
        password: newPassword,
        rememberMe: false,
      }).expect(200);

      const newSessionCookie = extractCookie(
        loginWithNewPassResponse,
        'sprinttacker-session',
      );
      expect(newSessionCookie).toBeDefined();
      expect(newSessionCookie).toMatch(/^sprinttacker-session=/);
    });
  });
});
