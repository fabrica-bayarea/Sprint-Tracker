import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordPayload } from 'src/types/jwt-payload.interface';
import { Request } from 'express';

@Injectable()
export class ResetPasswordGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request: Request & { user?: ResetPasswordPayload } = context
      .switchToHttp()
      .getRequest();

    // Pega o token do cookie (string ou array)
    let token: string | undefined;
    const rawCookie = request.cookies?.['reset_token'];

    if (Array.isArray(rawCookie)) {
      token = rawCookie[0];
    } else if (typeof rawCookie === 'string') {
      token = rawCookie;
    }

    if (!token) {
      throw new UnauthorizedException('Token de redefinição não fornecido.');
    }

    try {
      const secret = this.configService.get<string>('JWT_RESET_SECRET');
      if (!secret) throw new Error('JWT_RESET_SECRET não configurado.');

      const payload = this.jwtService.verify<ResetPasswordPayload>(token, {
        secret,
      });

      if (payload.purpose !== 'reset-password') {
        throw new UnauthorizedException(
          'Este token não é válido para redefinir a senha.',
        );
      }

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Token expirado.');
        }
        if (error.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('Token de redefinição inválido.');
        }

        throw new BadRequestException(
          'Erro ao validar token de redefinição: ' + String(error),
        );
      }
      throw new BadRequestException(
        'Erro desconhecido ao validar token de redefinição.',
      );
    }
  }
}
