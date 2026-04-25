import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProfileModule } from 'src/profile/profile.module';
import { LoggingMiddleware } from 'src/middleware/logging.middleware';
import { BoardModule } from 'src/board/board.module';
import { ListModule } from 'src/list/list.module';
import { TaskModule } from 'src/task/task.module';
import { HealthModule } from 'src/health/health.module';
import { TaskLogModule } from 'src/task-log/task-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    AuthModule.register(),
    ProfileModule,
    BoardModule,
    ListModule,
    TaskModule,
    TaskLogModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
