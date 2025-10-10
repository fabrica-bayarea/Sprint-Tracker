import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-microsoft';

interface MicrosoftProfile {
  id: string;
  displayName: string;
  emails: Array<{ value: string }>;
}

interface MicrosoftUser {
  microsoftId: string;
  email: string;
  name: string;
  accessToken: string;
}

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('MICROSOFT_CLIENT_ID');
    const clientSecret = configService.get<string>('MICROSOFT_CLIENT_SECRET');

    if (!clientID || !clientSecret) {
      throw new Error('Microsoft OAuth credentials are not configured');
    }

    const isProduction = configService.get<string>('NODE_ENV') === 'production';

    const baseUrl = configService.get<string>('BASE_URL') || 'http://localhost';
    const baseurlApi =
      configService.get<string>('BASE_URL_API') || 'http://localhost:3000';
    const ProductionBaseUrl = `${baseUrl}/api/v1/auth/microsoft/callback`;
    const DevelopmentBaseUrl = `${baseurlApi}/v1/auth/microsoft/callback`;
    const callbackURL = isProduction ? ProductionBaseUrl : DevelopmentBaseUrl;

    super({
      clientID: clientID,
      clientSecret: clientSecret,
      callbackURL,
      scope: ['user.read'],
      tenant: 'common',
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: MicrosoftProfile,
    done: (error: Error | null, user?: MicrosoftUser | false) => void,
  ): void {
    if (!profile?.id || !profile?.displayName || !profile?.emails?.[0]?.value) {
      return done(
        new Error('Perfil da Microsoft está incompleto ou inválido'),
        false,
      );
    }

    const user: MicrosoftUser = {
      microsoftId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      accessToken,
    };

    done(null, user);
  }
}
