import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignUpDto } from 'src/auth/dto/signup.dto';
import { BoardVisibility } from 'src/common/enums/board-visibility.enum';
import { CreateListDto } from 'src/list/dto/create-list.dto';
import cookieParser from 'cookie-parser';
import { App } from 'supertest/types';

describe('ListController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let trelloSessionCookie: string;
  let testUserId: string;
  let testBoardId: string;
  let anotherUserCookie: string;
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
    // Limpeza completa para todos os testes
    await prismaService.task.deleteMany({});
    await prismaService.list.deleteMany({});
    await prismaService.board.deleteMany({});
    await prismaService.user.deleteMany({
      where: { email: { startsWith: 'test.user' } },
    });
    await app.close();
  });

  beforeEach(async () => {
    // Criação de usuários e boards para cada teste, garantindo isolamento
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

    const anotherSignupResponse = await request(app.getHttpServer() as App)
      .post('/v1/auth/signup')
      .send(anotherSignupDto)
      .expect(HttpStatus.CREATED);
    anotherUserCookie = anotherSignupResponse.headers['set-cookie'][0];
    const anotherUser = await prismaService.user.findUnique({
      where: { email: anotherSignupDto.email },
    });
    if (!anotherUser) {
      throw new Error(`User not found for email: ${anotherSignupDto.email}`);
    }
    anotherUserId = anotherUser.id;

    // Criação de boards para cada usuário
    const myBoard = await prismaService.board.create({
      data: {
        title: 'Meu Quadro de Teste',
        ownerId: testUserId,
        visibility: BoardVisibility.PRIVATE,
      },
    });
    testBoardId = myBoard.id;

    const anotherBoard = await prismaService.board.create({
      data: {
        title: 'Quadro de Outro Usuário',
        ownerId: anotherUserId,
        visibility: BoardVisibility.PRIVATE,
      },
    });
    anotherUserBoardId = anotherBoard.id;
  });

  // --- Testes E2E para POST /v1/lists ---
  describe('POST /v1/lists', () => {
    it('should create a new list on a board the user owns', async () => {
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

    it('should return 400 Bad Request if the DTO is invalid', () => {
      return request(app.getHttpServer() as App)
        .post('/v1/lists')
        .set('Cookie', trelloSessionCookie)
        .send({ title: 'Título, mas sem boardId' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 401 Unauthorized if no authentication token is provided', () => {
      return request(app.getHttpServer() as App)
        .post('/v1/lists')
        .send({ title: 'Lista não autorizada', boardId: testBoardId })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 403 Forbidden if the user tries to create a list on a board they do not own', () => {
      const createDto = {
        title: 'Lista de Invasão',
        boardId: anotherUserBoardId,
        position: 1,
      };

      return request(app.getHttpServer() as App)
        .post('/v1/lists')
        .set('Cookie', trelloSessionCookie)
        .send(createDto)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  // --- Testes E2E para GET /v1/lists/board/:boardId ---
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

    it('should return all lists for a board the user owns', async () => {
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

    it('should return an empty array if the board has no lists', async () => {
      // Cria um novo quadro sem listas
      const newBoard = await prismaService.board.create({
        data: {
          title: 'Quadro Vazio',
          ownerId: testUserId,
          visibility: BoardVisibility.PRIVATE,
        },
      });
      const response = await request(app.getHttpServer() as App)
        .get(`/v1/lists/board/${newBoard.id}`)
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.OK);
      expect(response.body).toEqual([]);
    });

    it('should return 401 Unauthorized if no authentication token is provided', () => {
      return request(app.getHttpServer() as App)
        .get(`/v1/lists/board/${testBoardId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 403 Forbidden if the user tries to get lists from a board they do not own', () => {
      return request(app.getHttpServer() as App)
        .get(`/v1/lists/board/${anotherUserBoardId}`)
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  // --- Testes E2E para GET /v1/lists/:id ---
  describe('GET /v1/lists/:id', () => {
    let myListId: string;
    let anotherListId: string;

    beforeEach(async () => {
      const myList = await prismaService.list.create({
        data: {
          title: 'Minha Lista',
          boardId: testBoardId,
          position: 1,
        },
      });
      myListId = myList.id;

      const anotherList = await prismaService.list.create({
        data: {
          title: 'Lista de Outro Usuário',
          boardId: anotherUserBoardId,
          position: 1,
        },
      });
      anotherListId = anotherList.id;
    });

    it('should return a specific list by ID', async () => {
      const response = await request(app.getHttpServer() as App)
        .get(`/v1/lists/${myListId}`)
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.OK);
      expect((response.body as { id: string }).id).toEqual(myListId);
    });

    it('should return 404 Not Found if the list ID does not exist', () => {
      const nonExistentId = '12345678-abcd-1234-abcd-123456789012';
      return request(app.getHttpServer() as App)
        .get(`/v1/lists/${nonExistentId}`)
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.NOT_FOUND);
    });

    // TESTE DE VULNERABILIDADE: O controlador permite que o usuário acesse a lista de outro usuário.
    it("should return another user's list (VULNERABILITY)", async () => {
      const response = await request(app.getHttpServer() as App)
        .get(`/v1/lists/${anotherListId}`)
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.OK);
      const responseBody = response.body as { id: string; title: string };
      expect(responseBody.id).toEqual(anotherListId);
      expect(responseBody.title).toEqual('Lista de Outro Usuário');
    });
  });

  // --- Testes E2E para PATCH /v1/lists/:id ---
  describe('PATCH /v1/lists/:id', () => {
    let myListId: string;
    let anotherListId: string;

    beforeEach(async () => {
      const myList = await prismaService.list.create({
        data: {
          title: 'Minha Lista',
          boardId: testBoardId,
          position: 1,
        },
      });
      myListId = myList.id;

      const anotherList = await prismaService.list.create({
        data: {
          title: 'Lista de Outro Usuário',
          boardId: anotherUserBoardId,
          position: 1,
        },
      });
      anotherListId = anotherList.id;
    });

    it('should update a specific list', async () => {
      const updateDto = { title: 'Lista Atualizada', isArchived: true };
      const response = await request(app.getHttpServer() as App)
        .patch(`/v1/lists/${myListId}`)
        .set('Cookie', trelloSessionCookie)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject(updateDto);
    });

    it('should return 404 Not Found if the list ID does not exist', () => {
      const nonExistentId = '12345678-abcd-1234-abcd-123456789012';
      return request(app.getHttpServer() as App)
        .patch(`/v1/lists/${nonExistentId}`)
        .set('Cookie', trelloSessionCookie)
        .send({ title: 'Inexistente' })
        .expect(HttpStatus.NOT_FOUND);
    });

    // TESTE DE VULNERABILIDADE: O controlador permite que o usuário atualize a lista de outro usuário.
    it("should update another user's list (VULNERABILITY)", async () => {
      const updateDto = { title: 'Lista Invadida' };
      const response = await request(app.getHttpServer() as App)
        .patch(`/v1/lists/${anotherListId}`)
        .set('Cookie', trelloSessionCookie)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject(updateDto);
    });
  });

  // --- Testes E2E para PATCH /v1/lists/:id/position ---
  describe('PATCH /v1/lists/:id/position', () => {
    let list1Id: string, list2Id: string, list3Id: string;
    let anotherListId: string;

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

      const anotherList = await prismaService.list.create({
        data: {
          title: 'Lista de Outro Usuário',
          boardId: anotherUserBoardId,
          position: 1,
        },
      });
      anotherListId = anotherList.id;
    });

    it('should update the position of a list', async () => {
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

    it('should return 404 Not Found if the list ID does not exist', () => {
      const nonExistentId = '12345678-abcd-1234-abcd-123456789012';
      return request(app.getHttpServer() as App)
        .patch(`/v1/lists/${nonExistentId}/position`)
        .set('Cookie', trelloSessionCookie)
        .send({ newPosition: 1 })
        .expect(HttpStatus.NOT_FOUND);
    });

    // TESTE DE VULNERABILIDADE: O controlador permite que o usuário atualize a posição da lista de outro usuário.
    it("should update another user's list position (VULNERABILITY)", () => {
      return request(app.getHttpServer() as App)
        .patch(`/v1/lists/${anotherListId}/position`)
        .set('Cookie', trelloSessionCookie)
        .send({ newPosition: 100 })
        .expect(HttpStatus.OK);
    });
  });

  // --- Testes E2E para DELETE /v1/lists/:id ---
  describe('DELETE /v1/lists/:id', () => {
    let myListId: string;
    let anotherListId: string;

    beforeEach(async () => {
      const myList = await prismaService.list.create({
        data: {
          title: 'Minha Lista para Deletar',
          boardId: testBoardId,
          position: 1,
        },
      });
      myListId = myList.id;

      const anotherList = await prismaService.list.create({
        data: {
          title: 'Lista de Outro Usuário para Deletar',
          boardId: anotherUserBoardId,
          position: 1,
        },
      });
      anotherListId = anotherList.id;
    });

    it('should delete a specific list', async () => {
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

    it('should return 404 Not Found if the list ID does not exist', () => {
      const nonExistentId = '12345678-abcd-1234-abcd-123456789012';
      return request(app.getHttpServer() as App)
        .delete(`/v1/lists/${nonExistentId}`)
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.NOT_FOUND);
    });

    // TESTE DE VULNERABILIDADE: O controlador permite que o usuário remova a lista de outro usuário.
    it("should delete another user's list (VULNERABILITY)", async () => {
      const response = await request(app.getHttpServer() as App)
        .delete(`/v1/lists/${anotherListId}`)
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        message: 'Lista removida com sucesso',
      });
    });
  });
});
