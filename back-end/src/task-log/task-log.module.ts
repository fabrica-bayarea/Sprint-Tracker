import { Module } from '@nestjs/common';
import { TaskLogService } from './task-log.service';
import { TaskLogController } from './task-log.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TaskLogController],
  providers: [TaskLogService, PrismaService],
  exports: [TaskLogService],
})
export class TaskLogModule {}
