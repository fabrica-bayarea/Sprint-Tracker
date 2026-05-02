import { Prisma } from '@prisma/client';

export class PrismaQueries {
  boardInclude = {
    lists: {
      include: {
        tasks: true,
      },
    },
    owner: true,
  } satisfies Prisma.BoardInclude;

  listInclude = {
    tasks: true,
    board: true,
  } satisfies Prisma.ListInclude;

  taskInclude = {
    list: true,
  } satisfies Prisma.TaskInclude;
}
