import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { PrismaService } from '../prisma/prisma.service';
import { TaskLogModule } from 'src/task-log/task-log.module';

@Module({
  imports: [TaskLogModule],
  controllers: [TaskController],
  providers: [TaskService, PrismaService],
})
export class TaskModule {}
