import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LogAction } from '@prisma/client';

@Injectable()
export class TaskLogService {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(params: {
    taskId: string;
    userId: string;
    boardId: string;
    action: LogAction;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>;
  }) {
    return this.prisma.taskLog.create({
      data: {
        taskId: params.taskId,
        userId: params.userId,
        boardId: params.boardId,
        action: params.action,
        metadata: params.metadata ?? undefined,
      },
    });
  }

  async getLogsByTask(taskId: string, requesterId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId },
      include: {
        list: {
          include: { board: { include: { members: true } } },
        },
      },
    });

    if (!task) throw new NotFoundException('Tarefa não encontrada');

    const board = task.list.board;
    const membership = board.members.find((m) => m.userId === requesterId);

    const isOwner = board.ownerId === requesterId;
    const isAdmin = membership?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Apenas administradores podem visualizar os logs');
    }

    return this.prisma.taskLog.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async exportLogsCsv(taskId: string, requesterId: string): Promise<string> {
    const logs = await this.getLogsByTask(taskId, requesterId);

    const task = await this.prisma.task.findFirst({
      where: { id: taskId },
      select: { title: true },
    });

    const header = 'id,task_id,task_title,action,user_name,user_email,metadata,created_at';
    const rows = logs.map((log) => {
      const meta = log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : '';
      const userName = log.user.name.replace(/"/g, '""');
      const taskTitle = (task?.title ?? '').replace(/"/g, '""');
      return `"${log.id}","${log.taskId}","${taskTitle}","${log.action}","${userName}","${log.user.email}","${meta}","${log.createdAt.toISOString()}"`;
    });

    return [header, ...rows].join('\n');
  }
}
