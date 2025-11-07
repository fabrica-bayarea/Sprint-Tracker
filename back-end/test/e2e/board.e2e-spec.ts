import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '@/app.module';
import { SignUpDto } from '@/auth/dto/signup.dto';
import { PrismaService } from '@/prisma/prisma.service';

describe('Controlador de Quadros (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let trelloSessionCookie: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prismaService = app.get(PrismaService);
  });

  afterAll(async () => {
    await prismaService.task.deleteMany({});
    await prismaService.list.deleteMany({});
    await prismaService.invite.deleteMany({});
    await prismaService.boardMember.deleteMany({});
    await prismaService.board.deleteMany({});
    await prismaService.user.deleteMany({
      where: { email: { startsWith: 'test.user' } },
    });
    await app.close();
  });

  beforeEach(async () => {
    const uniqueId = Date.now();

    const mySignupDto: SignUpDto = {
      email: `test.user${uniqueId}@example.com`,
      password: 'Password123!',
      userName: `test_user${uniqueId}`,
      name: 'Test User',
    };

    const mySignupResponse = await request(app.getHttpServer() as App)
      .post('/v1/auth/signup')
      .send(mySignupDto)
      .expect(HttpStatus.CREATED);
    trelloSessionCookie = mySignupResponse.headers['set-cookie'][0];

    const myUser = await prismaService.user.findUnique({
      where: { email: mySignupDto.email },
    });
    if (!myUser)
      throw new Error(`User not found for email: ${mySignupDto.email}`);
    testUserId = myUser.id;
  });

  describe('Controlador de Quadros (e2e)', () => {
    it('/v1/boards (POST) - deve criar um quadro', async () => {
      const boardData = { title: 'Board 01' };

      const response = await request(app.getHttpServer() as App)
        .post('/v1/boards')
        .set('Cookie', trelloSessionCookie)
        .send(boardData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect((response.body as { title: string }).title).toBe(boardData.title);
    });

    it('/v1/boards (GET) - deve obter todos os quadros do usuário', async () => {
      await prismaService.board.createMany({
        data: [
          { title: 'Board 01', ownerId: testUserId },
          { title: 'Board 02', ownerId: testUserId },
        ],
      });

      const response = await request(app.getHttpServer() as App)
        .get('/v1/boards')
        .set('Cookie', trelloSessionCookie)
        .expect(200);
      expect(response.body).not.toBeNull();
      expect(response.status).toBe(200);
    });

    it('/v1/boards/:id (GET) - deve obter quadro por id', async () => {
      const board = await prismaService.board.create({
        data: { title: 'Board for Get by ID', ownerId: testUserId },
      });

      await prismaService.boardMember.create({
        data: { boardId: board.id, userId: testUserId, role: 'ADMIN' },
      });

      const response = await request(app.getHttpServer() as App)
        .get(`/v1/boards/${board.id}`)
        .set('Cookie', trelloSessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('id', board.id);
    });

    it('/v1/boards/:id (DELETE) - deve deletar quadro por id', async () => {
      const board = await prismaService.board.create({
        data: { title: 'Board to be deleted', ownerId: testUserId },
      });

      await prismaService.boardMember.create({
        data: { boardId: board.id, userId: testUserId, role: 'ADMIN' },
      });

      await request(app.getHttpServer() as App)
        .delete(`/v1/boards/${board.id}`)
        .set('Cookie', trelloSessionCookie)
        .expect(200);

      const deletedBoard = await prismaService.board.findUnique({
        where: { id: board.id },
      });
      expect(deletedBoard).toBeNull();
    });

    it('/v1/boards/:id (PATCH) - deve atualizar quadro por id', async () => {
      const board = await prismaService.board.create({
        data: { title: 'Board to be updated', ownerId: testUserId },
      });

      await prismaService.boardMember.create({
        data: { boardId: board.id, userId: testUserId, role: 'ADMIN' },
      });

      const updatedData = { title: 'Updated Board Title' };

      await request(app.getHttpServer() as App)
        .patch(`/v1/boards/${board.id}`)
        .set('Cookie', trelloSessionCookie)
        .send(updatedData)
        .expect(200);

      const updatedBoard = await prismaService.board.findUnique({
        where: { id: board.id },
      });

      expect(updatedBoard).toHaveProperty('title', updatedData.title);
    });
  });
});
