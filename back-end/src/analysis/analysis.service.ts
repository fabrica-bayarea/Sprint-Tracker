import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Status } from '@prisma/client';
import { endOfDay } from 'date-fns';

import { PrismaService } from '@/prisma/prisma.service';

import {
  CompletedSummaryResponse,
  DailyCompletedCount,
  GetCompletedSummaryDto,
} from './dto/get-completed-summary.dto';

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
}
