import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import cookieParser from 'cookie-parser';

process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST ||
  'postgresql://user_test:password_test@127.17.0.1:5433/postgres?schema=public';
process.env.JWT_SECRET = 'e2e_test_jwt_secret';
process.env.JWT_RESET_SECRET = 'e2e_test_jwt_reset_secret';
process.env.EMAIL = 'test@example.com';
process.env.PASS = 'testpassword';

describe('Boards (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const cleanDatabase = async () => {
    try {
      if (prismaService) {
        await prismaService.board.deleteMany();
        await prismaService.user.deleteMany(); // garante que o ownerId existe se precisar
      }
    } catch (error) {
      console.error('Erro ao limpar o banco de dados de teste:', error);
      throw error;
    }
  };
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignUpDto } from 'src/auth/dto/signup.dto';
import { BoardVisibility } from 'src/common/enums/board-visibility.enum';
import cookieParser from 'cookie-parser';
import { App } from 'supertest/types';

// Define a interface para o objeto de erro esperado, o que resolve o erro "no-explicit-any"
interface HttpError extends Error {
  response?: {
    body: unknown;
  };
}

describe('BoardController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let trelloSessionCookie: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
  });

  afterAll(async () => {
    await cleanDatabase();
    await app.close();
  });


  describe('Create Board Flow', () => {
    it('/v1/boards (POST) - should create a board', async () => {
      const user = await prismaService.user.create({
        data: {
          email: 'newuser@example.com',
          name: 'New User',
          userName: 'newuser',
          passwordHash: 'hashed_password_test',
          authProvider: 'local',
          role: 'ADMIN',
        },
    });

      const loginResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: user.email,
        password: 'hashed_password_test',
      })
      .expect(200);
      
      const token = loginResponse.body.accessToken;
      
      const dto = {
        title: 'Meu Board de Teste',
        description: 'Descrição de teste',
        ownerId: user.id,
      };

      const response = await request(app.getHttpServer())
      .post('/v1/boards')
      .set('Authorization', `Bearer ${token}`)
      .send(dto)
      .expect(201);

      const responseBody = response.body;
      expect(responseBody).toHaveProperty('id');
      expect(responseBody.title).toBe(dto.title);

      const boardInDb = await prismaService.board.findUnique({
        where: { id: responseBody.id },
      });
      expect(boardInDb).toBeDefined();
    });
  });
})
