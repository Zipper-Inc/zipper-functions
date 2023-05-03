import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { prisma } from './src/server/prisma';

jest.mock('./src/server/prisma.ts', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  mockReset(prismaMock);
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

jest.mock('ioredis');
jest.mock('bullmq', () => {
  const bullmq = jest.requireActual('bullmq');
  return {
    ...bullmq,
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      run: jest.fn(),
    })),
    Queue: jest.fn().mockImplementation(() => ({})),
  };
});
