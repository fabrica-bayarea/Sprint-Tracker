import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';

import { TaskCommentController } from './task-comment.controller';
import { TaskCommentService } from './task-comment.service';

@Module({
  imports: [PrismaModule],
  controllers: [TaskCommentController],
  providers: [TaskCommentService],
})
export class TaskCommentModule {}
