import { Module } from '@nestjs/common';

import { PrismaQueries } from '@/prisma/queries';
import { PrismaService } from '@/prisma/prisma.service';

@Module({
  imports: [],
  providers: [PrismaService, PrismaQueries],
  exports: [PrismaService, PrismaQueries],
})
export class PrismaModule {}
