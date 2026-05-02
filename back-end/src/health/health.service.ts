import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import * as packageJson from '../../package.json';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async getStatus() {
    const uptimeInSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const dbStatus = await this.checkDatabase();

    const healthReport = {
      status: dbStatus === 'ok' ? 'ok' : 'error',
      uptime: uptimeInSeconds.toString(),
      version: packageJson.version,
      dependencies: {
        database: dbStatus,
      },
    };

    return healthReport;
  }

  private async checkDatabase(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch (err) {
      console.error('Falha na verificação de saúde do banco de dados:', err);
      return 'unreachable';
    }
  }
}
