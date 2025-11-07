import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

interface GoogleProfile {
  id: string;
  displayName: string;
  name: { familyName: string; givenName: string };
  emails: Array<{ value: string; verified: boolean }>;
}

interface GoogleUser {
  google_id: string;
  email: string;
  name: string;
  access_token: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const isProduction = configService.get<string>('NODE_ENV') === 'production';

    const baseUrl = configService.get<string>('BASE_URL') || 'http://localhost';
    const baseurlApi =
      configService.get<string>('BASE_URL_API') || 'http://localhost:3000';
    const ProductionBaseUrl = `${baseUrl}/api/v1/auth/google/callback`;
    const DevelopmentBaseUrl = `${baseurlApi}/v1/auth/google/callback`;
    const callbackURL = isProduction ? ProductionBaseUrl : DevelopmentBaseUrl;

    if (!clientID || !clientSecret || !baseUrl) {
      throw new Error('Google OAuth configuration is missing');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): void {
    if (!profile?.id || !profile?.displayName || !profile?.emails?.[0]?.value) {
      return done(
        new Error('Perfil do Google está incompleto ou inválido'),
        false,
      );
    }

    const user: GoogleUser = {
      google_id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      access_token: accessToken,
    };

    done(null, user);
  }
}
