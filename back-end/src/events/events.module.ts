import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';

import { BoardGateway } from './board.gateway';
import { NotificationsGateway } from './notification.gateway';

@Module({
  providers: [NotificationsGateway, BoardGateway],
  imports: [PrismaModule],
  exports: [NotificationsGateway, BoardGateway],
})
export class EventsModule {}
