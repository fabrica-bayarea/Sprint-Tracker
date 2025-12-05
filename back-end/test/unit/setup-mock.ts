import { AuthenticatedUser } from '@/types/user.interface';

export const mockPrisma = {
  board: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  boardMember: {
    create: jest.fn(),
  },
  list: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  task: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

export const mockBoardGateway = {
  emitModifiedInBoard: jest.fn(),
};

export const mockNotificationGateway = {
  sendNewNotificationToUser: jest.fn(),
};

export const mockUser: AuthenticatedUser = {
  id: 'user-id',
  email: 'test@example.com',
  name: 'Test User',
  userName: 'testuser',
  role: 'ADMIN',
  authProvider: 'local',
};
