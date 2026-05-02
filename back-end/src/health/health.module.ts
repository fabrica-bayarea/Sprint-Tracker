import { Module } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [HealthService, PrismaService],
})
export class HealthModule {}
