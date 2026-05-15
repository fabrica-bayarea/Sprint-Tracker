import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';

import { SprintController } from './sprint.controller';
import { SprintService } from './sprint.service';

@Module({
  imports: [PrismaModule],
  controllers: [SprintController],
  providers: [SprintService],
})
export class SprintModule {}
