import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Status } from '@prisma/client';
import { endOfDay } from 'date-fns';

import { PrismaService } from '@/prisma/prisma.service';

import {
  CompletedSummaryResponse,
  DailyCompletedCount,
  GetCompletedSummaryDto,
} from './dto/get-completed-summary.dto';
import {
  BasicSummaryResponse,
  StatusCount,
} from './dto/get-basic-summary.dto';

@Injectable()
export class AnalysisService {
  constructor(private readonly prisma: PrismaService) {}
  async getCompletedTasksSummary(
    boardId: string,
    query: GetCompletedSummaryDto,
  ): Promise<CompletedSummaryResponse> {
    const { userId: assignedToId, startDate, endDate } = query;

    if (startDate > endDate) {
      throw new BadRequestException(
        'A data de início deve ser anterior à data de término.',
      );
    }

    const finalEndDate = endOfDay(endDate);
    const where: Prisma.TaskWhereInput = {
      status: Status.DONE,
      completedAt: {
        gte: startDate,
        lte: finalEndDate,
      },
      ...(assignedToId ? { assignedToId } : {}),
      list: {
        boardId: boardId,
      },
    };

    const completedTasks = await this.prisma.task.findMany({
      where: where,
      select: {
        completedAt: true,
      },
    });

    const dailyCountsMap: { [key: string]: number } = {};

    completedTasks.forEach((task) => {
      if (task.completedAt) {
        const dateKey = task.completedAt.toISOString().split('T')[0];
        dailyCountsMap[dateKey] = (dailyCountsMap[dateKey] || 0) + 1;
      }
    });

    const dailyCounts: DailyCompletedCount[] = Object.keys(dailyCountsMap).map(
      (date) => ({
        date,
        count: dailyCountsMap[date],
      }),
    );

    const result = {
      total: completedTasks.length,
      dailyCounts: dailyCounts.sort((a, b) => a.date.localeCompare(b.date)),
    };

    return result;
  }

  async getBasicSummary(boardId: string): Promise<BasicSummaryResponse> {
    const tasks = await this.prisma.task.findMany({
      where: {
        list: {
          boardId: boardId,
        },
        isArchived: false,
      },
      select: {
        status: true,
      },
    });

    const total = tasks.length;
    const statusCountMap: { [key: string]: number } = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };

    tasks.forEach((task) => {
      if (task.status !== Status.ARCHIVED) {
        statusCountMap[task.status] = (statusCountMap[task.status] || 0) + 1;
      }
    });

    const statusCounts: StatusCount[] = Object.keys(statusCountMap).map(
      (status) => {
        const count = statusCountMap[status];
        const percentage = total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0;
        return {
          status,
          count,
          percentage,
        };
      },
    );

    return {
      total,
      statusCounts,
    };
  }
}
