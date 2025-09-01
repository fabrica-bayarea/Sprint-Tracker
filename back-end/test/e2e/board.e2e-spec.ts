import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { BoardModule } from '../../src/board/board.module';
import { BoardService } from '../../src/board/board.service';
import { INestApplication } from '@nestjs/common';

describe('Board', () => {
  let app: INestApplication;
  const boardService = {
    findAll: () => ['test'],
    create: (dto: any) => ({
      id: 1,
      ...dto,
    }),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [BoardModule],
    })
      .overrideProvider(BoardService)
      .useValue(boardService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it(`/GET boards`, () => {
    return request(app.getHttpServer())
      .get('/boards')
      .expect(200)
      .expect(boardService.findAll()); // ["test"]
  });

  it(`/POST boards`, () => {
    return request(app.getHttpServer())
      .post('/boards')
      .send({
        title: 'Board Test',
        description: 'Description test', // 👈 precisa bater com o mock
      })
      .expect(200)
      .expect({
        id: 1,
        title: 'Board Test',
        description: 'Description test',
      });
  });
});
