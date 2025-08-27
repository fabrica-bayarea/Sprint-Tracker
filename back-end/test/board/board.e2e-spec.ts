import request from 'supertest';
import { Test } from '@nestjs/testing';
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
    const moduleRef = await Test.createTestingModule({
      imports: [BoardModule],
    })
      .overrideProvider(BoardService)
      .useValue(boardService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });
  it(`/GET boards`, () => {
    return request(app.getHttpServer()).get('/boards').expect(200).expect({
      data: boardService.findAll(),
    });
  });

  it(`/POST boards`, () => {
    return request(app.getHttpServer())
      .post('/boards')
      .expect(200)
      .expect({
        data: {
          id: 1,
          title: 'Board Test',
          description: 'Opcional Test',
        },
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
