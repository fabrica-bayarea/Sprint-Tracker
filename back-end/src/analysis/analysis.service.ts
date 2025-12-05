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
    userId: string,
    boardId: string,
    query: GetCompletedSummaryDto,
  ): Promise<CompletedSummaryResponse> {
    const { userId: assignedToId, startDate, endDate } = query;

    if (!startDate || !endDate) {
      throw new BadRequestException(
        'Os parâmetros startDate e endDate são obrigatórios para o resumo.',
      );
    }

    const finalEndDate = endOfDay(endDate);
    const where: Prisma.TaskWhereInput = {
      status: Status.DONE,
      completedAt: {
        gte: startDate,
        lte: finalEndDate,
      },
      ...(assignedToId
        ? { OR: [{ assignedToId }, { creatorId: userId }] }
        : {}),
      ...(boardId ? { list: { boardId } } : {}),
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

    return {
      total: completedTasks.length,
      dailyCounts: dailyCounts.sort((a, b) => a.date.localeCompare(b.date)),
    };
  }
}
