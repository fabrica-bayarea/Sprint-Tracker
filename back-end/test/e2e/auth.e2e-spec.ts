import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import cookieParser from 'cookie-parser';
import { EmailService } from '../../src/email/email.service';
import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

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
import { App } from 'supertest/types';

process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ||
  'postgresql://user_test:password_test@127.17.0.1:5433/postgres?schema=public';
process.env.JWT_SECRET = 'e2e_test_jwt_secret';
process.env.JWT_RESET_SECRET = 'e2e_test_jwt_reset_secret';
process.env.EMAIL = 'test@example.com';
process.env.PASS = 'testpassword';

const mockEmailService = {
  sendForgotPasswordEmail: jest.fn(),
};

describe('Auth (e2e) - Full Flow', () => {
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

  // --- Testes E2E para SignUp ---

  describe('SignUp Flow', () => {
    it('/v1/auth/signup (POST) - should register a new user and set trello-session cookie', async () => {
      const signUpDto = {
        email: 'newuser@example.com',
        password: 'StrongPassword123!',
        name: 'New User',
        userName: 'newuser',
      };

      const response = await performSignUp(app, signUpDto).expect(201);

      const sessionCookie = extractCookie(response, 'trello-session');
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toMatch(/^trello-session=/);
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

    it('/v1/auth/signup (POST) - should return 409 Conflict if email already exists', async () => {
      const signUpDto = {
        email: 'existing@example.com',
        password: 'StrongPassword123!',
        name: 'Existing User',
        userName: 'existinguser',
      };

      await performSignUp(app, signUpDto).expect(201);

      const response = await performSignUp(app, signUpDto).expect(409);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe(
        'Email ou nome de usuário já estão em uso',
      );
    });

    it('/v1/auth/signup (POST) - should return 409 Conflict if username already exists', async () => {
      const user1Dto = {
        email: 'user@example.com',
        password: 'Password123!',
        name: 'User One',
        userName: 'uniqueusername',
      };
      const user2Dto = {
        email: 'user@example.com',
        password: 'Password123!',
        name: 'User Two',
        userName: 'uniqueusername',
      };

      await performSignUp(app, user1Dto).expect(201);

      const response = await performSignUp(app, user2Dto).expect(409);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe(
        'Email ou nome de usuário já estão em uso',
      );
    });

    it('/v1/auth/signup (POST) - should return 400 Bad Request for invalid input (e.g., missing email)', async () => {
      const invalidSignUpDto = {
        email: '',
        password: 'Password123!',
        name: 'Invalid User',
        userName: 'invaliduser',
      };

      const response = await performSignUp(app, invalidSignUpDto).expect(400);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toEqual(
        expect.arrayContaining([
          'Preencha o campo de email.', // Ajustado para a mensagem do DTO
          'O e-mail deve ser um endereço de e-mail válido.',
        ]),
      );
    });
  });

  // --- Testes E2E para SignIn ---

  describe('SignIn Flow', () => {
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

    it('/v1/auth/signin (POST) - should login a user with valid credentials and set trello-session cookie', async () => {
      const signInDto = {
        email: userEmail,
        password: userPassword,
        rememberMe: false,
      };

      const response = await performSignIn(app, signInDto).expect(200);

      const sessionCookie = extractCookie(response, 'trello-session');
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toMatch(/^trello-session=/);
      expect(sessionCookie).toContain('HttpOnly');
      expect(sessionCookie).toContain('Path=/');

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe('Usuário autenticado com sucesso');
    });

    it('/v1/auth/signin (POST) - should return 401 Unauthorized for invalid password', async () => {
      const signInDto = {
        email: userEmail,
        password: 'WrongPassword!',
        rememberMe: false,
      };

      const response = await performSignIn(app, signInDto).expect(401);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe('Credenciais inválidas');
    });

    it('/v1/auth/signin (POST) - should return 401 Unauthorized for non-existent email', async () => {
      const signInDto = {
        email: 'nonexistent@example.com',
        password: 'AnyPassword!',
        rememberMe: false,
      };

      const response = await performSignIn(app, signInDto).expect(401);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe('Credenciais inválidas');
    });

    it('/v1/auth/signin (POST) - should return 400 Bad Request for invalid input (e.g., missing password)', async () => {
      const invalidSignInDto = {
        email: userEmail,
        password: '',
        rememberMe: false,
      };

      const response = await performSignIn(app, invalidSignInDto).expect(400);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toEqual(
        expect.arrayContaining([
          'Preencha com sua senha', // Ajustado para a mensagem do DTO
        ]),
      );
    });
  });

  // --- Testes E2E para ForgotPassword ---

  describe('ForgotPassword Flow', () => {
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

    it('/v1/auth/forgot-password (PATCH) - should return 200 OK and send email if user exists', async () => {
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

    it('/v1/auth/forgot-password (PATCH) - should return 200 OK even if email does not exist (security)', async () => {
      const nonExistentEmail = 'nonexistent@example.com';
      const forgotPasswordDto = { email: nonExistentEmail };

      const response = await initiateForgotPassword(
        app,
        forgotPasswordDto,
      ).expect(200);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe(
        'Se o email estiver cadastrado, as instruções para recuperação de senha foram enviadas.',
      );

      expect(mockEmailService.sendForgotPasswordEmail).not.toHaveBeenCalled();

      const userInDb = await prismaService.user.findUnique({
        where: { email: nonExistentEmail },
      });
      expect(userInDb).toBeNull();
    });

    it('/v1/auth/forgot-password (PATCH) - should return 400 Bad Request for invalid email format', async () => {
      const invalidEmailDto = { email: 'invalid-email' };

      const response = await initiateForgotPassword(
        app,
        invalidEmailDto,
      ).expect(400);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toEqual(
        expect.arrayContaining([
          'O e-mail deve ser um endereço de e-mail válido.',
        ]),
      );
    });
  });

  // --- Testes E2E para VerifyResetCode ---

  describe('VerifyResetCode Flow', () => {
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

    it('/v1/auth/verify-reset-code (POST) - should return 200 OK and set reset-token cookie for valid code', async () => {
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

    it('/v1/auth/verify-reset-code (POST) - should return 401 Unauthorized for invalid code', async () => {
      const verifyResetCodeDto = { code: 'WRONGCODE' };

      const response = await performVerifyResetCode(
        app,
        verifyResetCodeDto,
      ).expect(401);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe('Código inválido ou expirado.');
    });

    it('/v1/auth/verify-reset-code (POST) - should return 401 Unauthorized if code is expired', async () => {
      await cleanDatabase();
      await createTestUser(
        prismaService,
        'expiredcode@example.com',
        userPassword,
        'expiredcodeuser',
        'Expired Code User',
        Role.ADMIN,
        'EXPIREDCODE',
        new Date(Date.now() - 1000 * 60 * 5), // 5 minutos no passado
      );

      const verifyResetCodeDto = { code: 'EXPIREDCODE' };

      const response = await performVerifyResetCode(
        app,
        verifyResetCodeDto,
      ).expect(401);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe('Código de verificação expirado.');

      const userInDbAfterExpiration = await prismaService.user.findUnique({
        where: { email: 'expiredcode@example.com' },
      });
      expect(userInDbAfterExpiration?.resetToken).toBeNull();
      expect(userInDbAfterExpiration?.resetTokenExpiresAt).toBeNull();
    });

    it('/v1/auth/verify-reset-code (POST) - should return 400 Bad Request for invalid input', async () => {
      const invalidVerifyDto = {
        code: '',
      };

      const response = await performVerifyResetCode(
        app,
        invalidVerifyDto,
      ).expect(400);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toEqual(
        expect.arrayContaining([
          'O código de verificação não pode estar vazio.',
        ]),
      );
    });
  });

  // --- Testes E2E para ResetPassword ---

  describe('ResetPassword Flow', () => {
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

      resetTokenCookie = extractCookie(verifyResponse, 'reset-token') as string;
      expect(resetTokenCookie).toBeDefined();
    });

    it('/v1/auth/reset-password (POST) - should reset password with valid reset-token cookie', async () => {
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

      const sessionCookie = extractCookie(loginResponse, 'trello-session');
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toMatch(/^trello-session=/);

      const userInDbAfterReset = await prismaService.user.findUnique({
        where: { email: userEmail },
      });
      expect(userInDbAfterReset?.resetToken).toBeNull();
      expect(userInDbAfterReset?.resetTokenExpiresAt).toBeNull();
    });

    it('/v1/auth/reset-password (POST) - should return 401 Unauthorized if reset-token cookie is missing', async () => {
      const newPassword = 'NewStrongPassword456!';
      const resetPasswordDto = {
        newPassword: newPassword,
        confirmNewPassword: newPassword,
      };

      const response = await request(app.getHttpServer() as App)
        .post('/v1/auth/reset-password')
        .send(resetPasswordDto)
        .expect(401);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe('Token de redefinição não fornecido.');
    });

    it('/v1/auth/reset-password (POST) - should return 400 Bad Request for invalid new password (ValidationPipe)', async () => {
      const invalidNewPasswordDto = {
        newPassword: 'short',
        confirmNewPassword: 'short',
      };

      const response = await performResetPassword(
        app,
        invalidNewPasswordDto,
        resetTokenCookie,
      ).expect(400);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toEqual(
        expect.arrayContaining([
          'A nova senha deve ter pelo menos 8 caracteres, incluindo 1 letra maiúscula, 1 número e 1 caractere especial.',
          'A nova senha deve ter no mínimo 8 caracteres.',
          'A confirmação da senha deve ter no mínimo 8 caracteres.',
        ]),
      );
    });

    it('/v1/auth/reset-password (POST) - should return 400 Bad Request if passwords do not match', async () => {
      const mismatchPasswordDto = {
        newPassword: 'StrongPassword123!',
        confirmNewPassword: 'MismatchPassword!',
      };

      const response = await performResetPassword(
        app,
        mismatchPasswordDto,
        resetTokenCookie,
      ).expect(400);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toEqual(
        expect.arrayContaining(['As senhas não coincidem.']),
      );
    });

    it('/v1/auth/reset-password (POST) - should return 401 Unauthorized if reset-token is expired (via guard)', async () => {
      await cleanDatabase();
      const expiredUserEmail = 'expiredreset@example.com';
      await createTestUser(
        prismaService,
        expiredUserEmail,
        userPassword,
        'expiredresetuser',
        'Expired Reset User',
        Role.ADMIN,
        'EXPIREDCODE',
        new Date(Date.now() - 1000 * 60 * 5),
      );

      const expiredResetJwtToken = jwt.sign(
        {
          userId: (
            await prismaService.user.findUnique({
              where: { email: expiredUserEmail },
            })
          )?.id,
          email: expiredUserEmail,
          purpose: 'reset-password',
        },
        process.env.JWT_RESET_SECRET as string,
        { expiresIn: '1s' },
      );
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const expiredResetCookie = `reset-token=${expiredResetJwtToken}; Path=/v1/auth/reset-password; HttpOnly; SameSite=Lax; Max-Age=1`;

      const resetPasswordDto = {
        newPassword: 'NewStrongPassword123!',
        confirmNewPassword: 'NewStrongPassword123!',
      };

      const response = await performResetPassword(
        app,
        resetPasswordDto,
        expiredResetCookie,
      ).expect(401);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe(
        'Token de redefinição expirado ou inválido.',
      );
    });
  });

  // --- NOVOS TESTES E2E para ChangePassword ---

  describe('ChangePassword Flow', () => {
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

      sessionCookie = extractCookie(loginResponse, 'trello-session') as string;
      expect(sessionCookie).toBeDefined();
    });

    it('/v1/auth/change-password (PUT) - should change user password with valid old password', async () => {
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
        'trello-session',
      );
      expect(newSessionCookie).toBeDefined();
      expect(newSessionCookie).toMatch(/^trello-session=/);
    });

    it('/v1/auth/change-password (PUT) - should return 400 Bad Request if old password is incorrect', async () => {
      const changePasswordDto = {
        oldPassword: 'IncorrectOldPassword!',
        newPassword: newPassword,
        confirmNewPassword: newPassword,
      };

      const response = await performChangePassword(
        app,
        changePasswordDto,
        sessionCookie,
      ).expect(400);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe('Senha antiga incorreta.');
    });

    it('/v1/auth/change-password (PUT) - should return 401 Unauthorized if session cookie is missing', async () => {
      const changePasswordDto = {
        oldPassword: oldPassword,
        newPassword: newPassword,
        confirmNewPassword: newPassword,
      };

      const response = await request(app.getHttpServer() as App)
        .put('/v1/auth/change-password')
        .send(changePasswordDto)
        .expect(401);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toBe('Unauthorized');
    });

    it('/v1/auth/change-password (PUT) - should return 400 Bad Request for invalid new password (ValidationPipe)', async () => {
      const invalidNewPasswordDto = {
        oldPassword: oldPassword,
        newPassword: 'short',
        confirmNewPassword: 'short',
      };

      const response = await performChangePassword(
        app,
        invalidNewPasswordDto,
        sessionCookie,
      ).expect(400);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toEqual(
        expect.arrayContaining([
          'A nova senha deve ter pelo menos 8 caracteres, incluindo 1 letra maiúscula, 1 número e 1 caractere especial.',
          'A confirmação da senha deve ter pelo menos 8 caracteres, incluindo 1 letra maiúscula, 1 número e 1 caractere especial.',
        ]),
      );
    });

    it('/v1/auth/change-password (PUT) - should return 400 Bad Request if new passwords do not match', async () => {
      const mismatchPasswordDto = {
        oldPassword: oldPassword,
        newPassword: newPassword,
        confirmNewPassword: 'MismatchPassword!',
      };

      const response = await performChangePassword(
        app,
        mismatchPasswordDto,
        sessionCookie,
      ).expect(400);

      const responseBody = response.body as { message: string };
      expect(responseBody.message).toEqual(
        expect.arrayContaining(['As senhas não coincidem.']),
      );
    });
  });
});
