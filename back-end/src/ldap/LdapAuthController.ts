// src/auth/ldap-auth.controller.ts

import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { LdapAuthService } from './LdapAuthService';
import { LdapLoginDto } from './dto/LdapLoginDto';
import { AuthService } from '../auth/auth.service';

@Controller('auth/ldap')
export class LdapAuthController {
  constructor(
    private readonly ldapAuthService: LdapAuthService,
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  async login(
    @Body() loginRequest: LdapLoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<object> {
    const { enrollment, password } = loginRequest;

    const ldapUserAttributes = await this.ldapAuthService
      .authenticate(enrollment, password)
      .catch((e: Error) => {
        console.error('LDAP Auth Falhou:', e.message);

        throw new UnauthorizedException(e.message);
      });

    const { accessToken } = await this.authService.signInWithProvider('ldap', {
      providerId: ldapUserAttributes.uid,
      email: ldapUserAttributes.mail,
      name: ldapUserAttributes.displayName,
    });

    response.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000,
      sameSite: 'lax',
    });

    return {
      message: 'Login via LDAP bem-sucedido. Token armazenado no cookie.',
      user: {
        name: ldapUserAttributes.displayName,
        email: ldapUserAttributes.mail,
      },
    };
  }
}
