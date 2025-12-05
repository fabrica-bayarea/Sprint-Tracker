import { Module } from '@nestjs/common';

import { AuthModule } from '@/auth/auth.module';
import { PrismaModule } from '@/prisma/prisma.module';

import { BoardGateway } from './board.gateway';
import { NotificationsGateway } from './notification.gateway';

@Module({
  providers: [NotificationsGateway, BoardGateway],
  imports: [PrismaModule, AuthModule.register()],
  exports: [NotificationsGateway, BoardGateway],
})
export class EventsModule {}
