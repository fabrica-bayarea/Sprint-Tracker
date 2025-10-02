import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { performSignUp, performSignIn } from './auth.helpers';

describe('Task (e2e)', () => {
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

  it('/v1/tasks (POST) - deve criar uma task vinculada a list e user', async () => {
    const board = await prisma.board.create({
      data: { ownerId: userId, title: 'Board Teste' },
    });

    const list = await prisma.list.create({
      data: { title: 'Lista Teste', position: 1, boardId: board.id },
    });

    const response = await request(app.getHttpServer())
      .post('/v1/tasks')
      .set('Cookie', `trello-session=${token}`)
      .send({
        title: 'Task Teste',
        description: 'Essa é uma task associada a uma lista',
        status: "TODO",
        listId: list.id,
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Task Teste');
    })
    it('/v1/tasks (POST) - erro tentando criar task sem nome', async () =>{
        const board = await prisma.board.create({
            data: { ownerId: userId, title: 'Board Teste' },
        });

        const list = await prisma.list.create({
            data: { title: 'Lista Teste', position: 1, boardId: board.id },
        });

        const response = await request(app.getHttpServer())
        .post('/v1/tasks')
        .set('Cookie', `trello-session=${token}`)
        .send({
            title: '',
            description: 'Essa é uma task associada a uma lista',
            status: "TODO",
            listId: list.id,            
        })
        .expect(400)
        const responseBody = response.body as {message: string}
        expect(responseBody.message).toEqual(
            expect.arrayContaining([
                'Título da tarefa é obrigatório'
            ])
        )
    })

    it('v1/tasks (GET) - should return all tasks in a list', async()=>{
        const board = await prisma.board.create({
            data: {
                ownerId: userId,
                title: 'Board Para o GET'
            }
        })

        const list = await prisma.list.create({
            data: {
                title: 'Lista para o GET',
                position: 1,
                boardId: board.id
            }
        })

        const task01 = await prisma.task.create({
            data: 
                {
                    title: 'Task 01',
                    description: 'Descrição primeira task',
                    status: 'TODO',
                    listId: list.id,
                    creatorId: userId,
                    position: 1
                }
        })
        const task02 = await prisma.task.create({
            data: 
                {
                    title: 'Task 02',
                    description: 'Descrição segunda task',
                    status: 'TODO',
                    listId: list.id,
                    creatorId: userId,
                    position: 1
                }
        })

        const response = await request(app.getHttpServer())
        .get(`/v1/tasks/list/${list.id}`)
        .set('Cookie', `trello-session=${token}`)
        .expect(200)

        expect(response.body)

    })

    it('v1/tasks/:id (GET) - should return the selected task by the id', async()=>{
        const board = await prisma.board.create({
            data: {
                ownerId: userId,
                title: 'Board to get one task'
            }
        })

        const list = await prisma.list.create({
            data: {
                title: 'List to find one task',
                position: 1,
                boardId: board.id
            }
        })

        const task = await prisma.task.create({
            data: 
                {
                    title: 'Task 01',
                    description: 'Descrição única task',
                    status: 'TODO',
                    listId: list.id,
                    creatorId: userId,
                    position: 1
                }
        })

        const response = await request(app.getHttpServer())
        .get(`/v1/tasks/${task.id}`)
        .set('Cookie', `trello-session=${token}`)
        .expect(200)
        expect(response.body)
    })

    it('v1/tasks/:id (PATCH) - should return the update made by the user', async() =>{
      const board = await prisma.board.create({
          data: {
            ownerId: userId,
            title: 'Board to get updated'
          }
      })
        const list = await prisma.list.create({
            data: {
                title: 'List to be updated',
                position: 1,
                boardId: board.id
            }
        })

        const task = await prisma.task.create({
            data: 
                {
                    title: 'Task',
                    description: 'Task to be updated',
                    status: 'TODO',
                    listId: list.id,
                    creatorId: userId,
                    position: 1
                }
        })
        const updated_task = {
          title: 'Task Updated',
          description: 'New task description',
          status: 'TODO',
          position: 1
        }
        const response = await request(app.getHttpServer())
        .patch(`/v1/tasks/${task.id}`)
        .set('Cookie', `trello-session=${token}`)
        .send({title: "Task Updated"})
        .expect(200)

        expect(response.body).toMatchObject({
            id: task.id,
            title: 'Task Updated',
        })
    })

    it('v1/tasks/:id/position (PATCH) - should return the update made by the user', async() =>{
      const board = await prisma.board.create({
          data: {
            ownerId: userId,
            title: 'Board to get updated'
          }
      })
        const list = await prisma.list.create({
            data: {
                title: 'List to be updated',
                position: 1,
                boardId: board.id
            }
        })

        const task = await prisma.task.create({
            data: 
                {
                    title: 'Task',
                    description: 'Task to be updated',
                    status: 'TODO',
                    listId: list.id,
                    creatorId: userId,
                    position: 1
                }
        })
        const response = await request(app.getHttpServer())
        .patch(`/v1/tasks/${task.id}/position`)
        .set('Cookie', `trello-session=${token}`)
        .send({newPosition: 2})
        .expect(200)

        expect(response.body).toMatchObject({
          position: 2
        })
    })
  });
