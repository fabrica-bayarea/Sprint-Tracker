import { Module } from '@nestjs/common';

import { EventsModule } from '@/events/events.module';
import { ListService } from '@/list/list.service';
import { PrismaModule } from '@/prisma/prisma.module';

import { ListController } from './list.controller';

@Module({
  providers: [ListService],
  controllers: [ListController],
  imports: [EventsModule, PrismaModule],
})
export class ListModule {}
