import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { performSignUp, performSignIn } from './auth.helpers';
import request from 'supertest';
import { response } from 'express';
import { SignInDto } from 'src/auth/dto/signin.dto';

describe('Board (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const signUpDto = {
      email: 'taskuser@example.com',
      password: 'Password123!',
      name: 'Task User',
      userName: 'taskuser',
    };
    await performSignUp(app, signUpDto).expect(201);

    const loginResponse = await performSignIn(app, {
      email: signUpDto.email,
      password: signUpDto.password,
      rememberMe: false,
    }).expect(200);

    // essa parte aqui o copilot fez sozinho, era pra aceitar a variável cookies como array
    let cookies: string[] = [];
    const setCookieHeader = loginResponse.headers['set-cookie'];
    if (typeof setCookieHeader === 'string') {
      cookies = [setCookieHeader];
    } else if (Array.isArray(setCookieHeader)) {
      cookies = setCookieHeader;
    }
    if (!cookies || cookies.length === 0) throw new Error('Cookie não retornado no login');

    const sessionCookie = cookies.find(c => c.startsWith('trello-session='));
    if (!sessionCookie) throw new Error('Cookie "trello-session" não encontrado');

    token = sessionCookie.split(';')[0].split('=')[1];
    if (!token) throw new Error('Token não encontrado no cookie');

    const user = await prisma.user.findUnique({
      where: { email: signUpDto.email },
    });
    if (!user) throw new Error(`User not found: ${signUpDto.email}`);
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany();
    await prisma.list.deleteMany();
    await prisma.board.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  it('/v1/boards (POST) - should create a board', async () => {
    const response = await request(app.getHttpServer())
    .post('/v1/boards')
    .set('Cookie', `trello-session=${token}`)
    .send({
        title: 'Meu Primeiro Board',
        description: 'O título do board'
      })
    .expect(201);
    expect(response.body).toHaveProperty('id');
  })

  it('/v1/boards (GET) - should get all boards for user', async () => {
    const board01 = await prisma.board.create({
      data: {
        title: 'Board 01',
        ownerId: userId,
      },
    });
    const board02 = await prisma.board.create({
      data: {
        title: 'Board 02',
        ownerId: userId,
      },
    });
    const response = await request(app.getHttpServer())
    .get('/v1/boards')
    .set('Cookie', `trello-session=${token}`)
    .expect(200);
    expect(response.body)
  });
  it('/v1/boards/:id (GET) - should get board by id', async () => {
    const board = await prisma.board.create({
      data: {
        title: 'Board for Get by ID',
        ownerId: userId,
      },
    });
    const response = await request(app.getHttpServer())
    .get(`/v1/boards/${board.id}`)
    .set('Cookie', `trello-session=${token}`)
    .expect(200);
    expect(response.body).toHaveProperty('id', board.id);
    });

    it('/v1/boards/:id (DELETE) - should delete board by id', async () => {
      const board = await prisma.board.create({
        data: { title: 'Board to be deleted', ownerId: userId },
      });
      await request(app.getHttpServer())
        .delete(`/v1/boards/${board.id}`)
        .set('Cookie', `trello-session=${token}`)
        .expect(204);
        const deletedBoard = await prisma.board.findUnique({
            where: { id: board.id },
        });
        expect(deletedBoard).toBeNull();
    });
    it('/v1/boards/:id (DELETE) - should not delete board if not found the board id', async () => {
        const nonExistentBoardId = 'non-existent-board-id';
        const response = await request(app.getHttpServer())
        .delete(`/v1/boards/${nonExistentBoardId}`)
        .set('Cookie', `trello-session=${token}`)
        .expect(404);
        expect(response.body).toHaveProperty('message', 'Board not found.');
    });

    it('/v1/boards/:id (PATCH) - should update board by id', async () => {
      const board = await prisma.board.create({
        data: { 
            title: 'Board to be updated', 
            ownerId: userId },
        });
        const updatedBoard = { title: 'Updated Board Title' };
        const response = await request(app.getHttpServer())
        .patch(`/v1/boards/${board.id}`)
        .set('Cookie', `trello-session=${token}`)
        .send(updatedBoard)
        .expect(204);

        const updatedBoardFromDb = await prisma.board.findUnique({
            where: { id: board.id },
        });
        expect(updatedBoardFromDb).toHaveProperty('title', updatedBoard.title);
    })

    it('/v1/boards/:id (PATCH) - should not update board if not owner', async () => {
        const anotherUser = await prisma.user.create({
            data: {
                id: 'another-user-id',
                email: 'another-user@gmail.com',
                name: 'Another User',
                authProvider: 'local',
                userName: 'anotheruser',
                passwordHash: 'hashedpassword',
                role: 'MEMBER'
            }
      });

        const board = await prisma.board.create({
            data: { 
                title: 'Board not to be updated by another user', 
                ownerId: userId },
        });
        if (board.ownerId === anotherUser.id) {
            throw new Error('Test setup error: Board ownerId should not match anotherUser id');
        }
        const updatedBoard = { title: 'Malicious Update Attempt' };

        const response = await request(app.getHttpServer())
        .patch(`/v1/boards/${board.id}`)
        .set('Cookie', `trello-session=${token}`)
        .send(updatedBoard)
        .expect(204);
        expect(response.body).toEqual({});

    });
    it('/v1/boards (POST) - should not create board without title', async () => {
        const response = await request(app.getHttpServer())
        .post('/v1/boards')
        .set('Cookie', `trello-session=${token}`)
        .send({
            description: 'Board without a title'
        })
        .expect(400);
    expect(response.body.message).toContain('title should not be empty');
    })
});