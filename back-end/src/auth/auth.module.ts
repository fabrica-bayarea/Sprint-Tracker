import { DynamicModule, Module, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { JwtStrategy } from 'src/auth/strategy/jwt.strategy';
import { GoogleStrategy } from 'src/auth/strategy/google.strategy';
import { MicrosoftStrategy } from 'src/auth/strategy/microsoft.strategy';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { AuthController } from 'src/auth/auth.controller';
import { EmailModule } from '../email/email.module';
import { LdapAuthService } from 'src/ldap/LdapAuthService';
import { LdapAuthController } from 'src/ldap/LdapAuthController';

@Module({})
export class AuthModule {
  static register(): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        ConfigModule,
        PassportModule,
        EmailModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.getOrThrow<string>('JWT_SECRET'),
            signOptions: { expiresIn: '1d' },
          }),
        }),
      ],
      providers: [
        Logger,
        JwtStrategy,
        PrismaService,
        AuthService,
        LdapAuthService,
        {
          provide: 'OAUTH_STRATEGIES',
          useFactory: (configService: ConfigService) => [
            ...(configService.get<string>('ENABLE_GOOGLE_OAUTH') === 'true'
              ? [new GoogleStrategy(configService)]
              : []),
            ...(configService.get<string>('ENABLE_MICROSOFT_OAUTH') === 'true'
              ? [new MicrosoftStrategy(configService)]
              : []),
          ],
          inject: [ConfigService],
        },
      ],
      controllers: [AuthController, LdapAuthController],
      exports: [AuthService, JwtModule, LdapAuthService],
    };
  }
}
