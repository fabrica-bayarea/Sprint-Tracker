import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';

import { PokerController } from './poker.controller';
import { PokerGateway } from './poker.gateway';
import { PokerService } from './poker.service';

@Module({
  imports: [PrismaModule],
  controllers: [PokerController],
  providers: [PokerService, PokerGateway],
})
export class PokerModule {}
