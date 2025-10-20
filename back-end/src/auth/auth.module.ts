import { DynamicModule, Module, Logger } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from 'src/auth/strategy/jwt.strategy';
import { GoogleStrategy } from 'src/auth/strategy/google.strategy';
import { MicrosoftStrategy } from 'src/auth/strategy/microsoft.strategy';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { AuthController } from 'src/auth/auth.controller';
import { EmailModule } from '../email/email.module';
import { EmailService } from 'src/email/email.service';

@Module({})
export class AuthModule {
  static register(): DynamicModule {
    const isLdapEnabled = (config: ConfigService) =>
      config.get<string>('ENABLE_LDAP_OAUTH') === 'true';

    const baseProviders = [
      Logger,
      JwtStrategy,
      PrismaService,
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
    ];

    const authServiceProvider = {
      provide: AuthService,
      useFactory: (
        prismaService: PrismaService,
        jwtService: JwtService,
        configService: ConfigService,
        emailService: EmailService,
      ) => {
        if (isLdapEnabled(configService)) {
          Logger.log('LDAP Auth está HABILITADO', 'AuthModule');
        } else {
          Logger.log('LDAP Auth está DESABILITADO', 'AuthModule');
        }
        return new AuthService(
          prismaService,
          jwtService,
          configService,
          emailService,
        );
      },
      inject: [PrismaService, JwtService, ConfigService, EmailService],
    };

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
      providers: [...baseProviders, authServiceProvider],
      controllers: [AuthController],
      exports: [AuthService, JwtModule],
    };
  }
}
