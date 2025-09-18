import { Test, TestingModule } from '@nestjs/testing';
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
    // 1. Delete lists and boards first to avoid foreign key constraint errors
    await prismaService.list.deleteMany({});
    await prismaService.board.deleteMany({});

    // 2. Then, delete the users created during the tests
    await prismaService.user.deleteMany({
      where: { email: { startsWith: 'test.user' } },
    });

    await app.close();
  });

  beforeEach(async () => {
    // Clean up data from previous tests
    await prismaService.list.deleteMany({});
    await prismaService.board.deleteMany({});
    await prismaService.user.deleteMany({
      where: { email: { startsWith: 'test.user' } },
    });

    // Create a new user for each test to ensure a clean slate
    const signupDto: SignUpDto = {
      email: `test.user${Date.now()}@example.com`,
      password: 'Password123!',
      userName: `test_user${Date.now()}`,
      name: 'Test User',
    };

    try {
      const signupResponse = await request(app.getHttpServer() as App)
        .post('/v1/auth/signup')
        .send(signupDto)
        .expect(HttpStatus.CREATED);

      trelloSessionCookie = signupResponse.headers['set-cookie'][0];
      const user = await prismaService.user.findUnique({
        where: { email: signupDto.email },
      });

      if (user) {
        testUserId = user.id;
      } else {
        throw new Error('Usuário de teste não encontrado após o signup.');
      }
    } catch (error: unknown) {
      const httpError = error as HttpError;
      console.error(
        'Erro na requisição de signup ou criação do quadro:',
        httpError.response?.body || httpError.message,
      );
      throw error;
    }
  });

  // --- Testes E2E para POST /v1/boards ---
  describe('POST /v1/boards', () => {
    it('should create a new board for the authenticated user', async () => {
      const createDto = {
        title: 'Quadro de Teste',
        description: 'Descrição do quadro de teste.',
        visibility: BoardVisibility.PRIVATE,
      };

      const response = await request(app.getHttpServer() as App)
        .post('/v1/boards')
        .set('Cookie', trelloSessionCookie)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        title: createDto.title,
        description: createDto.description,
        visibility: createDto.visibility,
        ownerId: testUserId,
        isArchived: false,
      });
      const board = response.body as {
        id: string;
        title: string;
        description: string;
        visibility: BoardVisibility;
        ownerId: string;
        isArchived: boolean;
      };
      expect(board.id).toBeDefined();
    });

    it('should return 400 Bad Request if title is missing', () => {
      const createDto = {
        description: 'Descrição sem título',
        visibility: BoardVisibility.PUBLIC,
      };
      return request(app.getHttpServer() as App)
        .post('/v1/boards')
        .set('Cookie', trelloSessionCookie)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 401 Unauthorized if no authentication token is provided', () => {
      const createDto = {
        title: 'Quadro sem auth',
      };
      return request(app.getHttpServer() as App)
        .post('/v1/boards')
        .send(createDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // --- Testes E2E para GET /v1/boards ---
  describe('GET /v1/boards', () => {
    it('should return all boards for the authenticated user', async () => {
      const createDtos = [
        {
          title: 'Quadro 1',
          description: 'Descrição do Quadro 1',
          visibility: BoardVisibility.PRIVATE,
        },
        {
          title: 'Quadro 2',
          description: 'Descrição do Quadro 2',
          visibility: BoardVisibility.PUBLIC,
        },
      ];

      for (const dto of createDtos) {
        await request(app.getHttpServer() as App)
          .post('/v1/boards')
          .set('Cookie', trelloSessionCookie)
          .send(dto)
          .expect(HttpStatus.CREATED);
      }

      const response = await request(app.getHttpServer() as App)
        .get('/v1/boards')
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.OK);

      const boards = response.body as Array<{
        title: string;
        description: string;
        visibility: BoardVisibility;
      }>;

      expect(boards).toHaveLength(2);
      expect(boards[0]).toMatchObject({ title: 'Quadro 1' });
      expect(boards[1]).toMatchObject({ title: 'Quadro 2' });
    });

    it('should return an empty array if the user has no boards', async () => {
      const response = await request(app.getHttpServer() as App)
        .get('/v1/boards')
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.OK);
      expect(response.body).toEqual([]);
    });

    it('should return 401 Unauthorized if no authentication token is provided', () => {
      return request(app.getHttpServer() as App)
        .get('/v1/boards')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // --- Testes E2E para GET /v1/boards/:id ---
  describe('GET /v1/boards/:id', () => {
    let boardId: string;

    beforeEach(async () => {
      const createDto = {
        title: 'Quadro a ser buscado/atualizado/deletado',
        description: 'Descrição do quadro.',
        visibility: BoardVisibility.PRIVATE,
      };
      const response = await request(app.getHttpServer() as App)
        .post('/v1/boards')
        .set('Cookie', trelloSessionCookie)
        .send(createDto);

      boardId = (response.body as { id: string }).id;
    });

    it('should return a specific board by id for the authenticated user', async () => {
      const response = await request(app.getHttpServer() as App)
        .get(`/v1/boards/${boardId}`)
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.OK);

      expect((response.body as { id: string }).id).toEqual(boardId);
      expect((response.body as { id: string; title: string }).title).toEqual(
        'Quadro a ser buscado/atualizado/deletado',
      );
    });

    it('should return 404 Not Found if the board id does not exist', async () => {
      const nonExistentId = '12345678-abcd-1234-abcd-123456789012';
      await request(app.getHttpServer() as App)
        .get(`/v1/boards/${nonExistentId}`)
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 Unauthorized if no authentication token is provided', () => {
      return request(app.getHttpServer() as App)
        .get(`/v1/boards/${boardId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 Not Found if the user tries to get a board they do not own', async () => {
      const uniqueId = Date.now();
      const otherUserEmail = `test.user${uniqueId}@example.com`;
      const otherUserName = `test_user${uniqueId}`;
      const signupDto: SignUpDto = {
        email: otherUserEmail,
        password: 'Password123!',
        userName: otherUserName,
        name: 'Test User Forbidden',
      };
      const signupResponse = await request(app.getHttpServer() as App)
        .post('/v1/auth/signup')
        .send(signupDto)
        .expect(HttpStatus.CREATED);
      const otherUserCookie = signupResponse.headers['set-cookie'][0];

      await request(app.getHttpServer() as App)
        .get(`/v1/boards/${boardId}`)
        .set('Cookie', otherUserCookie)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  // --- Testes E2E para PATCH /v1/boards/:id ---
  describe('PUT /v1/boards/:id', () => {
    it('should update a specific board by id for the authenticated user', async () => {
      const uniqueId = Date.now();
      const signupDto: SignUpDto = {
        email: `test.user.put${uniqueId}@example.com`,
        password: 'Password123!',
        userName: `test_user_put${uniqueId}`,
        name: 'Test User PUT',
      };

      const signupResponse = await request(app.getHttpServer() as App)
        .post('/v1/auth/signup')
        .send(signupDto)
        .expect(HttpStatus.CREATED);

      const trelloSessionCookiePutTest =
        signupResponse.headers['set-cookie'][0];
      const user = await prismaService.user.findUnique({
        where: { email: signupDto.email },
      });
      if (!user) {
        throw new Error('Usuário de teste PUT não encontrado após o signup.');
      }
      const testUserIdPutTest = user.id;

      const createDto = {
        title: 'Quadro a ser atualizado',
        description: 'Descrição original.',
        visibility: BoardVisibility.PRIVATE,
      };
      const boardCreationResponse = await request(app.getHttpServer() as App)
        .post('/v1/boards')
        .set('Cookie', trelloSessionCookiePutTest)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      const boardId = (boardCreationResponse.body as { id: string }).id;

      const updateDto = {
        title: 'Quadro atualizado',
        description: 'Nova descrição.',
        visibility: BoardVisibility.PUBLIC,
      };
      // Altera o teste para usar PATCH e esperar 204 No Content
      await request(app.getHttpServer() as App)
        .patch(`/v1/boards/${boardId}`)
        .set('Cookie', trelloSessionCookiePutTest)
        .send(updateDto)
        .expect(HttpStatus.NO_CONTENT);

      // Verifica se o quadro foi atualizado no banco de dados
      const updatedBoard = await prismaService.board.findUnique({
        where: { id: boardId },
      });
      expect(updatedBoard).toMatchObject({
        ...updateDto,
        id: boardId,
        ownerId: testUserIdPutTest,
      });

      await prismaService.board.delete({ where: { id: boardId } });
      await prismaService.user.delete({ where: { id: testUserIdPutTest } });
    });

    it('should return 404 Not Found if the board id does not exist', async () => {
      const nonExistentId = '12345678-abcd-1234-abcd-123456789012';
      const updateDto = { title: 'Inexistente' };
      await request(app.getHttpServer() as App)
        .patch(`/v1/boards/${nonExistentId}`)
        .set('Cookie', trelloSessionCookie)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 Unauthorized if no authentication token is provided', async () => {
      const updateDto = { title: 'Não Autorizado' };
      await request(app.getHttpServer() as App)
        .patch(`/v1/boards/${testUserId}`)
        .send(updateDto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 Not Found if the user tries to update a board they do not own', async () => {
      const uniqueId = Date.now();
      const otherUserEmail = `test.user${uniqueId}@example.com`;
      const otherUserName = `test_user${uniqueId}`;
      const signupDto: SignUpDto = {
        email: otherUserEmail,
        password: 'Password123!',
        userName: otherUserName,
        name: 'Test User Forbidden',
      };
      const signupResponse = await request(app.getHttpServer() as App)
        .post('/v1/auth/signup')
        .send(signupDto)
        .expect(HttpStatus.CREATED);
      const otherUserCookie = signupResponse.headers['set-cookie'][0];

      const updateDto = { title: 'Proibido' };
      await request(app.getHttpServer() as App)
        .patch(`/v1/boards/${testUserId}`)
        .set('Cookie', otherUserCookie)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  // --- Testes E2E para DELETE /v1/boards/:id ---
  describe('DELETE /v1/boards/:id', () => {
    let boardId: string;

    beforeEach(async () => {
      const createDto = {
        title: 'Quadro a ser deletado',
        description: 'Descrição.',
        visibility: BoardVisibility.PRIVATE,
      };
      try {
        const response = await request(app.getHttpServer() as App)
          .post('/v1/boards')
          .set('Cookie', trelloSessionCookie)
          .send(createDto);
        boardId = (response.body as { id: string }).id;
        console.log(`Board created for DELETE test with ID: ${boardId}`);
      } catch (error) {
        console.error(
          'Failed to create board in beforeEach for DELETE tests',
          error,
        );
        throw error;
      }
    });

    it('should delete a specific board by id for the authenticated user', async () => {
      await request(app.getHttpServer() as App)
        .delete(`/v1/boards/${boardId}`)
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.NO_CONTENT);

      const deletedBoard = await prismaService.board.findUnique({
        where: { id: boardId },
      });
      expect(deletedBoard).toBeNull();
    });

    it('should return 404 Not Found if the board id does not exist', async () => {
      const nonExistentId = '12345678-abcd-1234-abcd-123456789012';
      await request(app.getHttpServer() as App)
        .delete(`/v1/boards/${nonExistentId}`)
        .set('Cookie', trelloSessionCookie)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 Unauthorized if no authentication token is provided', () => {
      return request(app.getHttpServer() as App)
        .delete(`/v1/boards/${boardId}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 Not Found if the user tries to delete a board they do not own', async () => {
      const uniqueId = Date.now();
      const otherUserEmail = `test.user${uniqueId}@example.com`;
      const otherUserName = `test_user${uniqueId}`;
      const signupDto: SignUpDto = {
        email: otherUserEmail,
        password: 'Password123!',
        userName: otherUserName,
        name: 'Test User Forbidden',
      };
      const signupResponse = await request(app.getHttpServer() as App)
        .post('/v1/auth/signup')
        .send(signupDto)
        .expect(HttpStatus.CREATED);
      const otherUserCookie = signupResponse.headers['set-cookie'][0];

      await request(app.getHttpServer() as App)
        .delete(`/v1/boards/${boardId}`)
        .set('Cookie', otherUserCookie)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
