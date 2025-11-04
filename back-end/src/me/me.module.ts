import { Module } from '@nestjs/common';

import { ProfileController } from '@/me/me.controller';
import { ProfileService } from '@/me/me.service';
import { PrismaService } from '@/prisma/prisma.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, PrismaService],
})
export class ProfileModule {}
