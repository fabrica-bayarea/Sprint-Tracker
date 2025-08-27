import request from 'supertest';
import { Test } from '@nestjs/testing';
import { TaskModule } from 'src/task/task.module';
import { TaskService } from 'src/task/task.service';
import { INestApplication } from '@nestjs/common';

describe('Board', () => {
  let app: INestApplication;
  const taskService = {
    findAll: () => ['test-task'],
    create: (dto: any) => ({
      id: 1,
      ...dto,
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TaskModule],
    })
      .overrideProvider(TaskService)
      .useValue(taskService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });
  it(`/GET tasks`, () => {
    return request(app.getHttpServer()).get('/tasks').expect(200).expect({
      data: taskService.findAll(),
    });
  });

  it(`/POST task`, () => {
    return request(app.getHttpServer())
      .post('/task')
      .expect(200)
      .expect({
        data: {
          id: 1,
          title: 'Task Test',
          description: 'Opcional Test',
        },
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
