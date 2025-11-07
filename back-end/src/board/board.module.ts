import { Module } from '@nestjs/common';

import { EventsModule } from '@/events/events.module';
import { PrismaModule } from '@/prisma/prisma.module';

import { BoardController } from './board.controller';
import { BoardService } from './board.service';

@Module({
  providers: [BoardService],
  controllers: [BoardController],
  imports: [EventsModule, PrismaModule],
})
export class BoardModule {}
