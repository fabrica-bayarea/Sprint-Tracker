import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { PokerService } from '@/poker/poker.service';

describe('PokerService', () => {
  let service: PokerService;

  const mockPrisma = {
    pokerSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    boardMember: {
      findFirst: jest.fn(),
    },
    pokerVotes: {
      create: jest.fn(),
    },
    board: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokerService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PokerService>(PokerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('deve criar e retornar a sessão', async () => {
      const dto = { title: 'Sessão 1', taskId: undefined };
      const boardId = 'board-123';

      const mockSession = {
        id: 'session-123',
        title: 'Sessão 1',
        boardId,
        inviteCode: 'abc123',
      };

      mockPrisma.board.findUnique.mockResolvedValue({
        id: boardId,
        name: 'Board 1',
      });
      mockPrisma.pokerSession.create.mockResolvedValue(mockSession);

      const result = await service.createPokerSession(dto, boardId);

      expect(result).toEqual(mockSession);
      expect(mockPrisma.pokerSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: dto.title,
            boardId,
          }),
        }),
      );
    });

    it('deve lançar NotFoundException se o board não existir', async () => {
      const dto = { title: 'Sessão 1', taskId: undefined };
      const boardId = 'board-123';

      mockPrisma.board.findUnique.mockResolvedValue(null);

      await expect(service.createPokerSession(dto, boardId)).rejects.toThrow(
        'Board not found',
      );
    });
  });
});
