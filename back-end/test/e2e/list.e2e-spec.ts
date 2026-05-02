import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '@/app.module';
import { SignUpDto } from '@/auth/dto/signup.dto';
import { BoardVisibility } from '@/common/enums/board-visibility.enum';
import { CreateListDto } from '@/list/dto/create-list.dto';
import { PrismaService } from '@/prisma/prisma.service';

describe('Controlador de Listas (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let trelloSessionCookie: string;
  let testUserId: string;
  let testBoardId: string;
  let anotherUserId: string;
  let anotherUserBoardId: string;

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
    if (!myUser) {
      throw new Error(`User not found for email: ${mySignupDto.email}`);
    }
    testUserId = myUser.id;

    await request(app.getHttpServer() as App)
      .post('/v1/auth/signup')
      .send(anotherSignupDto)
      .expect(HttpStatus.CREATED);
    const anotherUser = await prismaService.user.findUnique({
      where: { email: anotherSignupDto.email },
    });
    if (!anotherUser) {
      throw new Error(`User not found for email: ${anotherSignupDto.email}`);
    }
    anotherUserId = anotherUser.id;

    const myBoard = await prismaService.board.create({
      data: {
        title: 'Meu Quadro de Teste',
        ownerId: testUserId,
        visibility: BoardVisibility.PRIVATE,
      },
    });
    testBoardId = myBoard.id;

    await prismaService.boardMember.create({
      data: { boardId: testBoardId, userId: testUserId, role: 'ADMIN' },
    });

    const anotherBoard = await prismaService.board.create({
      data: {
        title: 'Quadro de Outro Usuário',
        ownerId: anotherUserId,
        visibility: BoardVisibility.PRIVATE,
      },
    });
    anotherUserBoardId = anotherBoard.id;

    await prismaService.boardMember.create({
      data: {
        boardId: anotherUserBoardId,
        userId: anotherUserId,
        role: 'ADMIN',
      },
    });
  });

  describe('POST /v1/lists', () => {
    it('deve criar uma nova lista em um quadro que o usuário possui', async () => {
      const createDto: CreateListDto = {
        title: 'Lista de Teste',
        boardId: testBoardId,
        position: 1,
      };

      const response = await request(app.getHttpServer() as App)
        .post('/v1/lists')
        .set('Cookie', trelloSessionCookie)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        title: createDto.title,
        boardId: createDto.boardId,
        position: createDto.position,
        isArchived: false,
      });
      expect((response.body as { id: string }).id).toBeDefined();
    });
  });

  describe('GET /v1/lists/board/:boardId', () => {
    const listIds: string[] = [];

    beforeEach(async () => {
      const listsToCreate = [
        { title: 'To Do', position: 1 },
        { title: 'In Progress', position: 2 },
      ];
      for (const list of listsToCreate) {
        const createdList = await prismaService.list.create({
          data: { ...list, boardId: testBoardId },
        });
        listIds.push(createdList.id);
      }
    });

    it('deve retornar todas as listas de um quadro que o usuário possui', async () => {
      const response = await request(app.getHttpServer() as App)
        .get(`/v1/lists/board/${testBoardId}`)
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveLength(2);
      const lists = response.body as Array<{
        title: string;
        position: number;
        [key: string]: unknown;
      }>;
      expect(lists[0]).toMatchObject({
        title: 'To Do',
        position: 1,
      });
      expect(lists[1]).toMatchObject({
        title: 'In Progress',
        position: 2,
      });
    });

    it('deve retornar um array vazio se o quadro não tiver listas', async () => {
      const newBoard = await prismaService.board.create({
        data: {
          title: 'Quadro Vazio',
          ownerId: testUserId,
          visibility: BoardVisibility.PRIVATE,
        },
      });

      await prismaService.boardMember.create({
        data: { boardId: newBoard.id, userId: testUserId, role: 'ADMIN' },
      });

      const response = await request(app.getHttpServer() as App)
        .get(`/v1/lists/board/${newBoard.id}`)
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.OK);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /v1/lists/:id', () => {
    let myListId: string;

    beforeEach(async () => {
      const myList = await prismaService.list.create({
        data: {
          title: 'Minha Lista',
          boardId: testBoardId,
          position: 1,
        },
      });
      myListId = myList.id;

      await prismaService.list.create({
        data: {
          title: 'Lista de Outro Usuário',
          boardId: anotherUserBoardId,
          position: 1,
        },
      });
    });

    it('deve retornar uma lista específica por ID', async () => {
      const response = await request(app.getHttpServer() as App)
        .get(`/v1/lists/${myListId}`)
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.OK);
      expect((response.body as { id: string }).id).toEqual(myListId);
    });
  });

  describe('PATCH /v1/lists/:id', () => {
    let myListId: string;

    beforeEach(async () => {
      const myList = await prismaService.list.create({
        data: {
          title: 'Minha Lista',
          boardId: testBoardId,
          position: 1,
        },
      });
      myListId = myList.id;

      await prismaService.list.create({
        data: {
          title: 'Lista de Outro Usuário',
          boardId: anotherUserBoardId,
          position: 1,
        },
      });
    });

    it('deve atualizar uma lista específica', async () => {
      const updateDto = { title: 'Lista Atualizada', isArchived: true };
      const response = await request(app.getHttpServer() as App)
        .patch(`/v1/lists/${myListId}`)
        .set('Cookie', trelloSessionCookie)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject(updateDto);
    });
  });

  describe('PATCH /v1/lists/:id/position', () => {
    let list1Id: string, list2Id: string, list3Id: string;

    beforeEach(async () => {
      const listsToCreate = [
        { title: 'Lista 1', position: 1 },
        { title: 'Lista 2', position: 2 },
        { title: 'Lista 3', position: 3 },
      ];
      const createdLists = await Promise.all(
        listsToCreate.map((list) =>
          prismaService.list.create({
            data: { ...list, boardId: testBoardId },
          }),
        ),
      );
      list1Id = createdLists[0].id;
      list2Id = createdLists[1].id;
      list3Id = createdLists[2].id;

      await prismaService.list.create({
        data: {
          title: 'Lista de Outro Usuário',
          boardId: anotherUserBoardId,
          position: 1,
        },
      });
    });

    it('deve atualizar a posição de uma lista', async () => {
      const newPosition = 2;
      const response = await request(app.getHttpServer() as App)
        .patch(`/v1/lists/${list3Id}/position`)
        .set('Cookie', trelloSessionCookie)
        .send({ newPosition })
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        position: newPosition,
      });

      const lists = await prismaService.list.findMany({
        where: { boardId: testBoardId },
        orderBy: { position: 'asc' },
      });

      expect(lists[0].id).toEqual(list1Id);
      expect(lists[0].position).toEqual(1);
      expect(lists[1].id).toEqual(list3Id);
      expect(lists[1].position).toEqual(2);
      expect(lists[2].id).toEqual(list2Id);
      expect(lists[2].position).toEqual(3);
    });
  });

  describe('DELETE /v1/lists/:id', () => {
    let myListId: string;

    beforeEach(async () => {
      const myList = await prismaService.list.create({
        data: {
          title: 'Minha Lista para Deletar',
          boardId: testBoardId,
          position: 1,
        },
      });
      myListId = myList.id;

      await prismaService.list.create({
        data: {
          title: 'Lista de Outro Usuário para Deletar',
          boardId: anotherUserBoardId,
          position: 1,
        },
      });
    });

    it('deve deletar uma lista específica', async () => {
      const response = await request(app.getHttpServer() as App)
        .delete(`/v1/lists/${myListId}`)
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        message: 'Lista removida com sucesso',
      });

      const deletedList = await prismaService.list.findUnique({
        where: { id: myListId },
      });
      expect(deletedList).toBeNull();
    });
  });
});
