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
          email: 'boardowner@example.com',
          name: 'Board Owner',
          userName: 'boardowner',
        },
      });

      const dto = {
        title: 'Meu Board de Teste',
        description: 'Descrição de teste',
        ownerId: user.id,
      };

      const response = await request(app.getHttpServer())
        .post('/v1/boards')
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

  describe('Get Boards Flow', () => {
    it('/v1/boards (GET) - should return list of boards', async () => {
      const user = await prismaService.user.create({
        data: {
          email: 'listboards@example.com',
          name: 'List Boards',
          userName: 'listboards',
        },
      });

      await prismaService.board.createMany({
        data: [
          { title: 'Board 1', description: 'Desc 1', ownerId: user.id },
          { title: 'Board 2', description: 'Desc 2', ownerId: user.id },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/v1/boards')
        .expect(200);

      const boards = response.body;
      expect(Array.isArray(boards)).toBe(true);
      expect(boards.length).toBeGreaterThanOrEqual(2);
    });

    it('/v1/boards/:id (GET) - should return a single board', async () => {
      const user = await prismaService.user.create({
        data: {
          email: 'getboard@example.com',
          name: 'Get Board',
          userName: 'getboard',
        },
      });

      const board = await prismaService.board.create({
        data: { title: 'Board único', description: 'teste', ownerId: user.id },
      });

      const response = await request(app.getHttpServer())
        .get(`/v1/boards/${board.id}`)
        .expect(200);

      const responseBody = response.body;
      expect(responseBody).toHaveProperty('id', board.id);
      expect(responseBody.title).toBe(board.title);
    });
  });

  describe('Update Board Flow', () => {
    it('/v1/boards/:id (PATCH) - should update a board', async () => {
      const user = await prismaService.user.create({
        data: {
          email: 'updateboard@example.com',
          password: 'hashedpassword',
          name: 'Update Board',
          userName: 'updateboard',
        },
      });

      const board = await prismaService.board.create({
        data: { title: 'Antigo', description: 'desc', ownerId: user.id },
      });

      const response = await request(app.getHttpServer())
        .patch(`/v1/boards/${board.id}`)
        .send({ title: 'Atualizado' })
        .expect(200);

      const responseBody = response.body;
      expect(responseBody.title).toBe('Atualizado');

      const updatedBoard = await prismaService.board.findUnique({
        where: { id: board.id },
      });
      expect(updatedBoard?.title).toBe('Atualizado');
    });
  });

  describe('Delete Board Flow', () => {
    it('/v1/boards/:id (DELETE) - should delete a board', async () => {
      const user = await prismaService.user.create({
        data: {
          email: 'deleteboard@example.com',
          password: 'hashedpassword',
          name: 'Delete Board',
          userName: 'deleteboard',
        },
      });

      const board = await prismaService.board.create({
        data: { title: 'Deletar', description: 'desc', ownerId: user.id },
      });

      await request(app.getHttpServer())
        .delete(`/v1/boards/${board.id}`)
        .expect(200);

      const boardInDb = await prismaService.board.findUnique({
        where: { id: board.id },
      });
      expect(boardInDb).toBeNull();
    });
  });
});
