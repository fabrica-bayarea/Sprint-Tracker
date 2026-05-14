import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AnalysisModule } from '@/analysis/analysis.module';
import { AuthModule } from '@/auth/auth.module';
import { BoardModule } from '@/board/board.module';
import { BoardMemberModule } from '@/board-member/board-member.module';
import { EventsModule } from '@/events/events.module';
import { HealthModule } from '@/health/health.module';
import { ListModule } from '@/list/list.module';
import { ProfileModule } from '@/me/me.module';
import { LoggingMiddleware } from '@/middleware/logging.middleware';
import { PrismaModule } from '@/prisma/prisma.module';
import { TaskModule } from '@/task/task.module';
import { TaskLogModule } from '@/task-log/task-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    AuthModule.register(),
    EventsModule,
    ProfileModule,
    BoardModule,
    ListModule,
    TaskModule,
    TaskLogModule,
    BoardMemberModule,
    HealthModule,
    AnalysisModule,
  ],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
