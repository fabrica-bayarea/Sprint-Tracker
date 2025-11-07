import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '@/auth/auth.module';
import { BoardModule } from '@/board/board.module';
import { EventsModule } from '@/events/events.module';
import { HealthModule } from '@/health/health.module';
import { ListModule } from '@/list/list.module';
import { ProfileModule } from '@/me/me.module';
import { LoggingMiddleware } from '@/middleware/logging.middleware';
import { PrismaModule } from '@/prisma/prisma.module';
import { TaskModule } from '@/task/task.module';

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
    HealthModule,
  ],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
