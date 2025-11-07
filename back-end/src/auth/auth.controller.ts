import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Req,
  UseGuards,
  Res,
  Logger,
  Patch,
  Put,
  Request,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Query,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiCookieAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { Response } from 'express';

import { AuthService } from '@/auth/auth.service';
import { ChangePasswordDto } from '@/auth/dto/change-password.dto';
import { ResetPasswordDto } from '@/auth/dto/reset-password.dto';
import { SignInDto } from '@/auth/dto/signin.dto';
import { SignUpDto } from '@/auth/dto/signup.dto';
import { VerifyResetCodeDto } from '@/auth/dto/verify-reset-code.dto';
import { IsEnabledAuthGuard } from '@/auth/guards/is-enable-oauth.guard';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { ResetPasswordGuard } from '@/auth/guards/reset-password.guard';
import { ForgotPasswordDto } from '@/email/dto/forgot-password.dto';

@ApiTags('Autenticação e Autorização')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  private get BASE_URL_UI(): string {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost';
    const baseUrlUI =
      this.configService.get<string>('BASE_URL_UI') || 'http://localhost:3001';
    return isProduction ? baseUrl : baseUrlUI;
  }

  private setCookieOptions(rememberMe = false) {
    const expirationTime = rememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 dias
      : 24 * 60 * 60 * 1000; // 1 dia

    return {
      httpOnly: true,
      path: '/',
      //secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax' as const,
      expires: new Date(Date.now() + expirationTime),
    };
  }

  @ApiOperation({
    summary: 'Cadastra um novo Usuário',
    description: 'Cria um novo usuário e o grava no banco de dados.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuário cadastrado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Usuário cadastrado com sucesso' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email já está em uso',
  })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  async signUp(@Body() dto: SignUpDto, @Res() res: Response) {
    try {
      if (
        !dto.email ||
        !dto.password ||
        dto.email.trim() === '' ||
        dto.password.trim() === ''
      ) {
        throw new BadRequestException('Email e senha são obrigatórios');
      }

      const result = await this.authService.signUp(dto);

      return res
        .cookie(
          'sprinttacker-session',
          result.accessToken,
          this.setCookieOptions(false),
        )
        .status(HttpStatus.CREATED)
        .json({ message: 'Usuário cadastrado com sucesso' });
    } catch (error) {
      this.logger.error(
        `Erro ao registrar usuário: ${(error as Error).message}`,
        error,
      );

      if (
        error instanceof HttpException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Erro interno durante o registro');
    }
  }

  @ApiOperation({
    summary: 'Autenticação de usuário',
    description:
      'Realiza a autenticação do usuário e retorna um token de acesso para utilização no sistema.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário autenticado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Usuário autenticado com sucesso' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  @ApiBadRequestResponse({ description: 'Dados de login inválidos' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signIn(@Body() dto: SignInDto, @Res() res: Response) {
    try {
      const result = await this.authService.signIn(dto);

      return res
        .cookie(
          'sprinttacker-session',
          result.accessToken,
          this.setCookieOptions(dto.rememberMe),
        )
        .status(HttpStatus.OK)
        .json({ message: 'Usuário autenticado com sucesso' });
    } catch (error) {
      this.logger.error(
        `Erro ao autenticar usuário: ${(error as Error).message}`,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno durante a autenticação',
      );
    }
  }

  @ApiOperation({ summary: 'Iniciar autenticação com Google' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redireciona para a página de login do Google',
  })
  @UseGuards(IsEnabledAuthGuard('google', 'ENABLE_GOOGLE_OAUTH'))
  @Get('google')
  async googleAuth() {
    // Inicia o fluxo de autenticação do Google (redirecionamento handled by AuthGuard)
  }

  @ApiOperation({ summary: 'Callback do Google após autenticação' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Login do Google bem-sucedido',
  })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  @Get('google/callback')
  @UseGuards(IsEnabledAuthGuard('google', 'ENABLE_GOOGLE_OAUTH'))
  async googleAuthRedirect(
    @Req()
    req: {
      user: {
        google_id: string;
        email: string;
        name: string;
        access_token: string;
      };
    },
    @Res() res: Response,
  ) {
    try {
      const { user } = req;

      if (!user || !user.google_id || !user.email) {
        this.logger.warn('Dados do usuário do Google incompletos');
        return res.redirect(
          `${this.BASE_URL_UI}/auth/error?message=incomplete_google_data`,
        );
      }

      const authResult = await this.authService.signInWithProvider('google', {
        providerId: user.google_id,
        email: user.email,
        name: user.name,
      });

      if (!authResult?.accessToken) {
        throw new Error('Token de acesso não gerado');
      }

      return res
        .cookie(
          'sprinttacker-session',
          authResult.accessToken,
          this.setCookieOptions(false),
        )
        .redirect(`${this.BASE_URL_UI}/dashboard`);
    } catch (error) {
      this.logger.error(
        `Erro no callback do Google: ${(error as Error).message}`,
      );
      return res.redirect(
        `${this.BASE_URL_UI}/auth/error?message=google_login_failed`,
      );
    }
  }

  @ApiOperation({ summary: 'Iniciar autenticação com Microsoft' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Redireciona para a página de login da Microsoft',
  })
  @Get('microsoft')
  @UseGuards(IsEnabledAuthGuard('microsoft', 'ENABLE_MICROSOFT_OAUTH'))
  async microsoftAuth() {
    // Inicia o fluxo de autenticação da Microsoft (redirecionamento handled by AuthGuard)
  }

  @ApiOperation({ summary: 'Callback da Microsoft após autenticação' })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: 'Login da Microsoft bem-sucedido',
  })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  @Get('microsoft/callback')
  @UseGuards(IsEnabledAuthGuard('microsoft', 'ENABLE_MICROSOFT_OAUTH'))
  async microsoftAuthRedirect(
    @Req()
    req: {
      user: {
        microsoftId: string;
        email: string;
        name: string;
        access_token: string;
      };
    },
    @Res() res: Response,
  ) {
    try {
      const { user } = req;

      if (!user || !user.microsoftId || !user.email) {
        this.logger.warn('Dados do usuário da Microsoft incompletos');
        return res.redirect(
          `${this.BASE_URL_UI}/auth/error?message=incomplete_microsoft_data`,
        );
      }

      const authResult = await this.authService.signInWithProvider(
        'microsoft',
        {
          providerId: user.microsoftId,
          email: user.email,
          name: user.name,
        },
      );

      if (!authResult?.accessToken) {
        throw new Error('Token de acesso não gerado');
      }

      return res
        .cookie(
          'sprinttacker-session',
          authResult.accessToken,
          this.setCookieOptions(false),
        )
        .redirect(`${this.BASE_URL_UI}/dashboard`);
    } catch (error) {
      this.logger.error(
        `Erro no callback da Microsoft: ${(error as Error).message}`,
      );
      return res.redirect(
        `${this.BASE_URL_UI}/auth/error?message=microsoft_login_failed`,
      );
    }
  }

  @ApiOperation({
    summary: 'Envia email para recuperação de senha',
    description:
      'Envia um email com instruções para recuperação de senha ao usuário.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Se o email estiver cadastrado, as instruções para recuperação de senha foram enviadas.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email de recuperação enviado com sucesso',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Email inválido ou não fornecido' })
  @ApiInternalServerErrorResponse({ description: 'Falha ao enviar o email' })
  @HttpCode(HttpStatus.OK)
  @Patch('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    try {
      await this.authService.forgotPassword(forgotPasswordDto);
      return {
        message:
          'Se o email estiver cadastrado, as instruções para recuperação de senha foram enviadas.',
      };
    } catch (error) {
      this.logger.error(
        `Erro ao processar esqueci senha: ${(error as Error).message}`,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno ao processar solicitação',
      );
    }
  }

  @ApiOperation({
    summary:
      'Redefine a senha do usuário autenticado pelo código enviado por email',
    description:
      'Permite que o usuário redefina sua senha usando um token JWT gerado após verificar o código de redefinição.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Senha redefinida com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Senha redefinida com sucesso!' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  @ApiUnauthorizedResponse({ description: 'Código de verificação inválido' })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ResetPasswordGuard)
  async resetPassword(
    @Query('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @Req() req: { user: { userId: string } },
  ) {
    const userId = req.user.userId;
    await this.authService.resetPassword(userId, resetPasswordDto.newPassword);
    return { message: 'Senha redefinida com sucesso!' };
  }

  @ApiOperation({
    summary:
      'Verifica o código de recuperação de senha e retorna JWT em cookie',
    description:
      'Verifica o código enviado por email e, se válido, define um JWT de redefinição em um cookie HTTP-only.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Código verificado com sucesso. Token JWT definido no cookie.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Código verificado com sucesso. Você pode redefinir sua senha.',
        },
      },
    },
    headers: {
      'Set-Cookie': {
        description: 'Cookie HTTP-only contendo o token JWT de redefinição.',
        schema: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou código expirado/inválido',
  })
  @HttpCode(HttpStatus.OK)
  @Post('verify-reset-code')
  async verifyResetCode(
    @Body() verifyResetCodeDto: VerifyResetCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const resetJwtToken =
        await this.authService.verifyResetCode(verifyResetCodeDto);

      res.cookie('reset-token', resetJwtToken, {
        httpOnly: true,
        //secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
        path: '/v1/auth/reset-password',
      });

      return {
        message:
          'Código verificado com sucesso. Você pode redefinir sua senha.',
      };
    } catch (error) {
      this.logger.error(
        `Erro ao verificar código de reset: ${(error as Error).message}`,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno ao verificar código de recuperação.',
      );
    }
  }

  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Altera a senha do usuário autenticado',
    description: 'Permite que o usuário autenticado altere sua senha atual.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Senha alterada com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Senha alterada com sucesso' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  @ApiBadRequestResponse({ description: 'Dados inválidos fornecidos' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno do servidor' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Put('change-password')
  async changePassword(
    @Request() req: { user: { id: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    try {
      const userId = req.user.id;
      await this.authService.changePassword(userId, dto);

      return { message: 'Senha alterada com sucesso' };
    } catch (error) {
      this.logger.error(
        `Erro ao alterar senha para usuário ${req.user.id}: ${(error as Error).message}`,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Erro interno ao alterar senha');
    }
  }

  @ApiCookieAuth()
  @ApiOperation({
    summary: 'Logout do usuário',
    description:
      'Realiza o logout do usuário removendo o token de autenticação.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logout realizado com sucesso' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Usuário não autenticado' })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Res() res: Response) {
    try {
      return res
        .clearCookie('sprinttacker-session', {
          httpOnly: true,
          path: '/',
          secure: this.configService.get<string>('NODE_ENV') === 'production',
          sameSite: 'lax',
        })
        .status(HttpStatus.OK)
        .json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      this.logger.error(`Erro ao realizar logout: ${(error as Error).message}`);
      throw new InternalServerErrorException('Erro interno ao realizar logout');
    }
  }
}
