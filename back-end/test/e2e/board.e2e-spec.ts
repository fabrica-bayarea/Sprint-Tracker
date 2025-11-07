import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignUpDto } from 'src/auth/dto/signup.dto';
import cookieParser from 'cookie-parser';
import { App } from 'supertest/types';

describe('ListController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let trelloSessionCookie: string;
  let testUserId: string;
  let anotherUserCookie: string;
  let anotherUserId: string;

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

    const anotherSignupDto: SignUpDto = {
      email: `test.another${uniqueId}@example.com`,
      password: 'Password123!',
      userName: `another_user${uniqueId}`,
      name: 'Another User',
    };

    const mySignupResponse = await request(app.getHttpServer() as App)
      .post('/v1/auth/signup')
      .send(mySignupDto)
      .expect(HttpStatus.CREATED);
    trelloSessionCookie = mySignupResponse.headers['set-cookie'][0];

    const myUser = await prismaService.user.findUnique({
      where: { email: mySignupDto.email },
    });
    if (!myUser) throw new Error(`User not found for email: ${mySignupDto.email}`);
    testUserId = myUser.id;

    const anotherSignupResponse = await request(app.getHttpServer() as App)
      .post('/v1/auth/signup')
      .send(anotherSignupDto)
      .expect(HttpStatus.CREATED);
    anotherUserCookie = anotherSignupResponse.headers['set-cookie'][0];

    const anotherUser = await prismaService.user.findUnique({
      where: { email: anotherSignupDto.email },
    });
    if (!anotherUser) throw new Error(`User not found for email: ${anotherSignupDto.email}`);
    anotherUserId = anotherUser.id;
  });

  describe('BoardsController (e2e)', () => {
    it('/v1/boards (POST) - should create a board', async () => {
      const boardData = { title: 'Board 01' };

      const response = await request(app.getHttpServer())
        .post('/v1/boards')
        .set('Cookie', trelloSessionCookie)
        .send(boardData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(boardData.title);
    });

    it('/v1/boards (GET) - should get all boards for user', async () => {
      await prismaService.board.createMany({
        data: [
          { title: 'Board 01', ownerId: testUserId },
          { title: 'Board 02', ownerId: testUserId },
        ],
      });

      const response = await request(app.getHttpServer())
        .get('/v1/boards')
        .set('Cookie', trelloSessionCookie)
        .expect(200);
      expect(response.body).not.toBeNull();
      expect(response.status).toBe(200);
    });

    it('/v1/boards/:id (GET) - should get board by id', async () => {
      const board = await prismaService.board.create({
        data: { title: 'Board for Get by ID', ownerId: testUserId },
      });

      const response = await request(app.getHttpServer())
        .get(`/v1/boards/${board.id}`)
        .set('Cookie', trelloSessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('id', board.id);
    });

    it('/v1/boards/:id (DELETE) - should delete board by id', async () => {
      const board = await prismaService.board.create({
        data: { title: 'Board to be deleted', ownerId: testUserId },
      });

      await request(app.getHttpServer())
        .delete(`/v1/boards/${board.id}`)
        .set('Cookie', trelloSessionCookie)
        .expect(204);

      const deletedBoard = await prismaService.board.findUnique({
        where: { id: board.id },
      });
      expect(deletedBoard).toBeNull();
    });

    it('/v1/boards/:id (DELETE) - should not delete if board not found', async () => {
      const nonExistentBoardId = 'non-existent-board-id';

      const response = await request(app.getHttpServer())
        .delete(`/v1/boards/${nonExistentBoardId}`)
        .set('Cookie', trelloSessionCookie)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Board not found.');
    });

    it('/v1/boards/:id (PATCH) - should update board by id', async () => {
      const board = await prismaService.board.create({
        data: { title: 'Board to be updated', ownerId: testUserId },
      });

      const updatedData = { title: 'Updated Board Title' };

      await request(app.getHttpServer())
        .patch(`/v1/boards/${board.id}`)
        .set('Cookie', trelloSessionCookie)
        .send(updatedData)
        .expect(204);

      const updatedBoard = await prismaService.board.findUnique({
        where: { id: board.id },
      });

      expect(updatedBoard).toHaveProperty('title', updatedData.title);
    });
  });
});
