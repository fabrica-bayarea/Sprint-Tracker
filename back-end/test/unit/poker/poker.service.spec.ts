import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { PokerService } from '@/poker/poker.service';
import { PokerStatus } from '@prisma/client';

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

  describe('submitVote', () => {
    it('deve criar um voto', async () => {
      const dto = { sessionId: 'session-123', value: '5' };
      const userId = 'user-123';
      const mockSession = {
        id: 'session-123',
        pokerStatus: PokerStatus.VOTING,
      };

      mockPrisma.pokerSession.findUnique.mockResolvedValue(mockSession);
      mockPrisma.boardMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId,
        boardId: 'board-123',
      });
      mockPrisma.pokerVotes.create.mockResolvedValue({
        id: 'vote-123',
        sessionId: dto.sessionId,
        userId,
        value: dto.value,
      });

      const result = await service.submitVote(dto, userId);

      expect(result).toEqual({
        id: 'vote-123',
        sessionId: dto.sessionId,
        userId,
        value: dto.value,
      });
      expect(mockPrisma.pokerVotes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
                  voteValue: '5',
                  pokerSessionId: 'session-123',
                  boardMemberId: expect.any(String),
                  boardMemberUserId: expect.any(String),
          }),
        }),
      );
    });
    it('deve lançar NotFoundException se a sessão não existir', async () => {
      const dto = { sessionId: 'session-123', value: '5' };
      const userId = 'user-123';

      mockPrisma.pokerSession.findUnique.mockResolvedValue(null);

      await expect(service.submitVote(dto, userId)).rejects.toThrow(
        'Poker session not found',
      );
    });
    it('deve lançar BadRequestException se a sessão não estiver em status VOTING', async () => {
      const dto = { sessionId: 'session-123', value: '5' };
      const userId = 'user-123';
      const mockSession = {
        id: 'session-123',
        pokerStatus: PokerStatus.WAITING,
      };

      mockPrisma.pokerSession.findUnique.mockResolvedValue(mockSession);

      await expect(service.submitVote(dto, userId)).rejects.toThrow(
        'Please, wait for voting phase',
      );
    });
    it('deve lançar BadRequestException se o usuário não for membro do board', async () => {
      const dto = { sessionId: 'session-123', value: '5' };
      const userId = 'user-123';
      const mockSession = {
        id: 'session-123',
        pokerStatus: PokerStatus.VOTING,
      };

      mockPrisma.pokerSession.findUnique.mockResolvedValue(mockSession);
      mockPrisma.boardMember.findFirst.mockResolvedValue(null);

      await expect(service.submitVote(dto, userId)).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('revealVotes', () => {
    it('deve atualizar o status da sessão para REVEALED', async () => {
      const sessionId = 'session-123';
      const mockSession = {
        id: sessionId,
        pokerStatus: PokerStatus.VOTING,
      };

      mockPrisma.pokerSession.findUnique.mockResolvedValue(mockSession);
      mockPrisma.pokerSession.update.mockResolvedValue({
        ...mockSession,
        pokerStatus: PokerStatus.REVEALED,
      });

      const result = await service.revealVotes(sessionId);

      expect(result).toEqual({
        ...mockSession,
        pokerStatus: PokerStatus.REVEALED,
      });
      expect(mockPrisma.pokerSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: sessionId },
          data: { pokerStatus: PokerStatus.REVEALED },
        }),
      );
    });
    it('deve lançar NotFoundException se a sessão não existir', async () => {
      const sessionId = 'session-123';

      mockPrisma.pokerSession.findUnique.mockResolvedValue(null);

      await expect(service.revealVotes(sessionId)).rejects.toThrow(
        'Poker session ID not found',
      );
    });
    it('deve lançar BadRequestException se a sessão não estiver em status VOTING', async () => {
      const sessionId = 'session-123';
      const mockSession = {
        id: sessionId,
        pokerStatus: PokerStatus.WAITING,
      };

      mockPrisma.pokerSession.findUnique.mockResolvedValue(mockSession);

      await expect(service.revealVotes(sessionId)).rejects.toThrow(
        'lease wait for the next round',
      );
    });
  });
});
