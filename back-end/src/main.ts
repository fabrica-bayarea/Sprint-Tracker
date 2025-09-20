import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe());

  const DEBUG = configService.get<string>('DEBUG') === 'true';
  const CORS_ORIGIN = configService.get<string>('CORS_ORIGIN') || '*';
  const PORT = configService.get<string>('PORT') ?? 3000;

  app.useLogger(
    DEBUG
      ? ['log', 'error', 'warn', 'debug', 'verbose']
      : ['log', 'error', 'warn'],
  );

  const logger = new Logger('Bootstrap');

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  // Middleware
  app.use(cookieParser());
  app.use(
    helmet({
      frameguard: {
        action: 'sameorigin',
      },
      contentSecurityPolicy: {
        directives: {
          upgradeInsecureRequests: null,
        },
      },
    }),
  );

  // CORS Configuration
  app.enableCors({
    origin: CORS_ORIGIN,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Swagger Configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sprint Tacker API - IESB')
    .setDescription('Documentação da API do Sprint Tracker do BayArea - IESB')
    .addCookieAuth('sprinttacker-session')
    .setExternalDoc(
      'Documentação adicional',
      'https://github.com/fabrica-bayarea/Sprint-Tracker',
    )
    .setContact('BayArea', '', 'nde.ads@iesb.br')
    .setLicense(
      'License GPL-3.0',
      'https://github.com/fabrica-bayarea/Sprint-Tracker?tab=GPL-3.0-1-ov-file',
    )
    .addTag(
      'Autenticação e Autorização',
      'Autenticação e autorização via cookie "sprinttacker-session" (JWT).',
    )
    .addTag(
      'Perfil de usuário',
      'Operações relacionadas ao perfil e gerenciamento de usuários.',
    )
    .addTag(
      'Quadros',
      'Gerenciamento de quadros (criação, listagem, atualização e remoção).',
    )
    .addTag(
      'Listas',
      'Gerenciamento de listas dentro dos quadros (criação, ordenação, atualização e remoção).',
    )
    .addTag(
      'Tarefas',
      'Gerenciamento de tarefas dentro das listas (criação, movimentação, atualização, remoção e atribuição).',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Sprint Tacker API - IESB',
    customfavIcon:
      'https://www.iesb.br/content/themes/iesb-chleba-themosis/favicon.png',
    customCss: `
      .swagger-ui .topbar { 
        background: transparent linear-gradient(96deg, #CC0000 0%, #F00B54 100%) 0% 0% no-repeat padding-box; 
      }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'head'],
    },
  });

  // Start the application
  await app.listen(PORT);
  logger.log(`Application is running on: http://localhost:${PORT}`);

  process.on('SIGINT', (): void => {
    logger.log('Recebido SIGINT. Desligando...');
    void app.close().then(() => {
      logger.log('Aplicação desligada.');
      process.exit(0);
    });
  });

  process.on('SIGTERM', (): void => {
    logger.log('Recebido SIGTERM. Desligando...');
    void app.close().then(() => {
      logger.log('Aplicação desligada.');
      process.exit(0);
    });
  });
}

void bootstrap();
