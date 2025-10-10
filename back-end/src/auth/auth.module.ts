import { DynamicModule, Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { JwtStrategy } from 'src/auth/strategy/jwt.strategy';
import { GoogleStrategy } from 'src/auth/strategy/google.strategy';
import { MicrosoftStrategy } from 'src/auth/strategy/microsoft.strategy';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { AuthController } from 'src/auth/auth.controller';
import { EmailModule } from '../email/email.module';
import { LdapAuthService } from 'src/ldap/LdapAuthService';
import { LdapAuthController } from 'src/ldap/LdapAuthController';

export const OAUTH_STRATEGIES_TOKEN = 'OAUTH_STRATEGIES';

// Lógica de fábrica extraída para uma função nomeada e mais legível.
function createOauthStrategies(configService: ConfigService) {
  const strategies: Array<GoogleStrategy | MicrosoftStrategy> = [];

  if (configService.get<string>('ENABLE_GOOGLE_OAUTH') === 'true') {
    strategies.push(new GoogleStrategy(configService));
  }

  if (configService.get<string>('ENABLE_MICROSOFT_OAUTH') === 'true') {
    strategies.push(new MicrosoftStrategy(configService));
  }

  return strategies;
}

// Configuração JWT extraída para uma função nomeada.
function getJwtConfig(configService: ConfigService) {
  return {
    secret: configService.getOrThrow<string>('JWT_SECRET'),
    signOptions: { expiresIn: '1d' },
  };
}

/**
 * AuthModule é um módulo global que configura autenticação usando JWT e estratégias OAuth.
 * Estratégias OAuth são configuradas dinamicamente com base nas variáveis de ambiente.
 * A configuração do JWT é feita de forma assíncrona para permitir o uso de variáveis de ambiente.
 */
@Module({})
export class AuthModule {
  static register(): DynamicModule {
    return {
      module: AuthModule,
      global: true,
      providers: [
        Logger,
        JwtStrategy,
        AuthService,
        LdapAuthService,
        {
          provide: OAUTH_STRATEGIES_TOKEN,
          useFactory: createOauthStrategies,
          inject: [ConfigService],
        },
      ],
      controllers: [AuthController, LdapAuthController],
      exports: [AuthService, JwtModule, LdapAuthService],
    };
  }
}
