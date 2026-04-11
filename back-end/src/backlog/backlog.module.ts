import { PrismaService } from '../prisma/prisma.service';
import { BacklogService } from './backlog.service';
import { BacklogController } from './backlog.controller';
import { Module } from '@nestjs/common';

@Module({
  controllers: [BacklogController],
  providers: [BacklogService, PrismaService],
})
export class BacklogModule {}
