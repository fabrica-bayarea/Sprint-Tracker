import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { performSignUp, performSignIn } from './auth.helpers';
import {App} from "supertest/types";

describe('Task (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let trelloSessionCookie: string;

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

    await performSignUp(app, signUpDto).expect(HttpStatus.CREATED);

    const loginResponse = await performSignIn(app, {
      email: signUpDto.email,
      password: signUpDto.password,
      rememberMe: false,
    }).expect(HttpStatus.OK);

    trelloSessionCookie = loginResponse.headers['set-cookie'][0];

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

  it('/v1/tasks (POST) - deve criar uma task vinculada a list e user', async () => {
    const board = await prisma.board.create({
      data: { ownerId: userId, title: 'Board Teste' },
    });

    const list = await prisma.list.create({
      data: { title: 'Lista Teste', position: 1, boardId: board.id },
    });

    const response = await request(app.getHttpServer())
      .post('/v1/tasks')
      .set('Cookie', trelloSessionCookie)
      .send({
        title: 'Task Teste',
        description: 'Essa é uma task associada a uma lista',
        status: 'TODO',
        listId: list.id,
      })
      .expect(HttpStatus.CREATED);

    expect(response.body).toBeDefined();
  });

  it('/v1/tasks (POST) - erro tentando criar task sem nome', async () => {
    const board = await prisma.board.create({
      data: { ownerId: userId, title: 'Board Teste' },
    });

    const list = await prisma.list.create({
      data: { title: 'Lista Teste', position: 1, boardId: board.id },
    });

    const response = await request(app.getHttpServer())
      .post('/v1/tasks')
      .set('Cookie', trelloSessionCookie)
      .send({
        title: '',
        description: 'Essa é uma task associada a uma lista',
        status: 'TODO',
        listId: list.id,
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toBeDefined();
  });

  it('/v1/tasks/list/:listId (GET) - deve retornar todas as tasks da lista', async () => {
    const board = await prisma.board.create({
      data: { ownerId: userId, title: 'Board Para o GET' },
    });

    const list = await prisma.list.create({
      data: { title: 'Lista para o GET', position: 1, boardId: board.id },
    });

    await prisma.task.createMany({
      data: [
        {
          title: 'Task 01',
          description: 'Primeira task',
          status: 'TODO',
          listId: list.id,
          creatorId: userId,
          position: 1,
        },
        {
          title: 'Task 02',
          description: 'Segunda task',
          status: 'TODO',
          listId: list.id,
          creatorId: userId,
          position: 2,
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get(`/v1/tasks/list/${list.id}`)
      .set('Cookie', trelloSessionCookie)
      .expect(HttpStatus.OK);

    expect(response.body).toBeDefined();
  });

  it('/v1/tasks/:id (GET) - deve retornar uma task específica', async () => {
    const board = await prisma.board.create({
      data: { ownerId: userId, title: 'Board to get one task' },
    });

    const list = await prisma.list.create({
      data: { title: 'List to find one task', position: 1, boardId: board.id },
    });

    const task = await prisma.task.create({
      data: {
        title: 'Task 01',
        description: 'Descrição única task',
        status: 'TODO',
        listId: list.id,
        creatorId: userId,
        position: 1,
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/v1/tasks/${task.id}`)
      .set('Cookie', trelloSessionCookie)
      .expect(HttpStatus.OK);

    expect(response.body).toBeDefined();
  });

  it('/v1/tasks/:id (PATCH) - deve atualizar a task', async () => {
    const board = await prisma.board.create({
      data: { ownerId: userId, title: 'Board to update' },
    });

    const list = await prisma.list.create({
      data: { title: 'List to update', position: 1, boardId: board.id },
    });

    const task = await prisma.task.create({
      data: {
        title: 'Task',
        description: 'To update',
        status: 'TODO',
        listId: list.id,
        creatorId: userId,
        position: 1,
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/v1/tasks/${task.id}`)
      .set('Cookie', trelloSessionCookie)
      .send({ title: 'Task Updated' })
      .expect(HttpStatus.OK);

    expect(response.body).toBeDefined();
  });

  it('/v1/tasks/:id/position (PATCH) - deve atualizar a posição', async () => {
    const board = await prisma.board.create({
      data: { ownerId: userId, title: 'Board Position Update' },
    });

    const list = await prisma.list.create({
      data: { title: 'List Position', position: 1, boardId: board.id },
    });

    const task = await prisma.task.create({
      data: {
        title: 'Task',
        description: 'Position update',
        status: 'TODO',
        listId: list.id,
        creatorId: userId,
        position: 1,
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/v1/tasks/${task.id}/position`)
      .set('Cookie', trelloSessionCookie)
      .send({ newPosition: 2 })
      .expect(HttpStatus.OK);

    expect(response.body).toBeDefined();
  });

  it('/v1/tasks/:id (DELETE) - deve deletar a task', async () => {
    const board = await prisma.board.create({
      data: { ownerId: userId, title: 'Board Delete' },
    });

    const list = await prisma.list.create({
      data: { title: 'List Delete', position: 1, boardId: board.id },
    });

    const task = await prisma.task.create({
      data: {
        title: 'Task Delete',
        description: 'Deleted task',
        status: 'TODO',
        listId: list.id,
        creatorId: userId,
        position: 1,
      },
    });

    const response = await request(app.getHttpServer())
      .delete(`/v1/tasks/${task.id}`)
      .set('Cookie', trelloSessionCookie)
      .expect(HttpStatus.OK);

    expect(response.body).toBeDefined();
  });

  it('/v1/tasks/due/today (GET) - deve retornar tasks com vencimento hoje', async () => {
    const board = await prisma.board.create({
      data: { ownerId: userId, title: 'Board Overdue' },
    });

    const list = await prisma.list.create({
      data: { title: 'List Overdue', position: 1, boardId: board.id },
    });

    await prisma.task.create({
      data: {
        title: 'Overdue Task',
        description: 'Overdue description',
        status: 'TODO',
        listId: list.id,
        creatorId: userId,
        position: 1,
        dueDate: new Date(),
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/v1/tasks/due/today`)
      .set('Cookie', trelloSessionCookie)
      .expect(HttpStatus.OK);

    expect(response.body).toBeDefined();
  });

  it('/v1/tasks/:id/move (PATCH) - deve mover task para outra lista', async () => {
    const board = await prisma.board.create({
      data: { ownerId: userId, title: 'Board Move' },
    });

    const list1 = await prisma.list.create({
      data: { title: 'List 1', position: 1, boardId: board.id },
    });

    const list2 = await prisma.list.create({
      data: { title: 'List 2', position: 2, boardId: board.id },
    });

    const task = await prisma.task.create({
      data: {
        title: 'Task to move',
        description: 'Task moving test',
        status: 'TODO',
        listId: list1.id,
        creatorId: userId,
        position: 1,
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/v1/tasks/${task.id}/move`)
      .set('Cookie', trelloSessionCookie)
      .send({ newListId: list2.id, newPosition: 1 })
      .expect(HttpStatus.OK);

    expect(response.body).toBeDefined();
  });
});
