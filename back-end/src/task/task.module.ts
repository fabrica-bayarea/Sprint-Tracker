import { Module } from '@nestjs/common';

import { EventsModule } from '@/events/events.module';
import { PrismaModule } from '@/prisma/prisma.module';

import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  providers: [TaskService],
  controllers: [TaskController],
  imports: [EventsModule, PrismaModule],
})
export class TaskModule {}
