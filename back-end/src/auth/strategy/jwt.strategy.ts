import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { Strategy } from 'passport-jwt';

import { PrismaService } from '@/prisma/prisma.service';

import { jwtFromCookie } from './utils/jwt-cookie-extraction';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: jwtFromCookie,
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        (() => {
          throw new Error('JWT_SECRET is not defined');
        })(),
    });
  }

  async validate(payload: { sub: string }): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('Usuario não encontrado');
    }
    return user;
  }
}
