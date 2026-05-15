import { Module } from '@nestjs/common';

import { PrismaModule } from '@/prisma/prisma.module';

import { LabelController } from './label.controller';
import { LabelService } from './label.service';

@Module({
  imports: [PrismaModule],
  controllers: [LabelController],
  providers: [LabelService],
})
export class LabelModule {}
