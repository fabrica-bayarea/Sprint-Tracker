import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { Role } from '@prisma/client';
import { PrismaQueries } from 'src/prisma/queries';

@Injectable()
export class BoardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaQueries: PrismaQueries,
  ) {}

  create(ownerId: string, dto: CreateBoardDto) {
    return this.prisma.board.create({
      data: {
        ...dto,
        ownerId,
      },
    });
  }

  findAll(ownerId: string) {
    return this.prisma.board.findMany({
      where: { ownerId, isArchived: false },
      include: this.prismaQueries.boardInclude,
    });
  }

  async findOne(id: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: this.prismaQueries.boardInclude,
    });
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async getUserRole(
    boardId: string,
    userId: string,
  ): Promise<Role | 'OWNER' | null> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { members: { where: { userId } } },
    });
    if (!board) throw new NotFoundException('Board not found');
    if (board.ownerId === userId) return 'OWNER';
    if (board.members.length > 0) return board.members[0].role;
    return null;
  }

  async update(id: string, dto: UpdateBoardDto) {
    await this.findOne(id);
    return this.prisma.board.update({
      where: { id },
      data: { ...dto },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Cascade-delete all child records manually (no onDelete: Cascade in schema)

    // 1. Collect all task IDs belonging to this board's lists
    const lists = await this.prisma.list.findMany({
      where: { boardId: id },
      select: { id: true },
    });
    const listIds = lists.map((l) => l.id);

    if (listIds.length > 0) {
      const tasks = await this.prisma.task.findMany({
        where: { listId: { in: listIds } },
        select: { id: true },
      });
      const taskIds = tasks.map((t) => t.id);

      if (taskIds.length > 0) {
        await this.prisma.taskLabel.deleteMany({
          where: { taskId: { in: taskIds } },
        });
        await this.prisma.task.deleteMany({
          where: { listId: { in: listIds } },
        });
      }

      await this.prisma.list.deleteMany({ where: { boardId: id } });
    }

    // 2. Delete TaskLogs referencing this board (created/moved logs)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await this.prisma.taskLog.deleteMany({ where: { boardId: id } });

    // 3. Delete Sprint-related records
    const sprints = await this.prisma.sprint.findMany({
      where: { boardId: id },
      select: { id: true },
    });
    const sprintIds = sprints.map((s) => s.id);
    if (sprintIds.length > 0) {
      await this.prisma.sprintBacklogItem.deleteMany({
        where: { sprintId: { in: sprintIds } },
      });
    }
    await this.prisma.sprint.deleteMany({ where: { boardId: id } });

    // 4. Delete Backlogs (SprintBacklogItems referencing backlogs already deleted above)
    await this.prisma.backlog.deleteMany({ where: { boardId: id } });

    // 5. Delete Labels (TaskLabels already deleted above)
    await this.prisma.label.deleteMany({ where: { boardId: id } });

    // 6. Delete BoardMembers
    await this.prisma.boardMember.deleteMany({ where: { boardId: id } });

    return this.prisma.board.delete({ where: { id } });
  }
}
