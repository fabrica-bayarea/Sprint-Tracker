import { Module } from '@nestjs/common';
import { BoardMemberController } from './board-member.controller';
import { BoardMemberService } from './board-member.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [BoardMemberController],
  providers: [BoardMemberService, PrismaService],
})
export class BoardMemberModule {}
