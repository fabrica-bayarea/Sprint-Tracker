import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Client } from 'ldapts';

interface UserPayload {
  uid: string;
  displayName: string;
  mail: string;
}

@Injectable()
export class LdapAuthService {
  private adminClient: Client;
  private userBaseDn: string;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    this.userBaseDn =
      this.configService.getOrThrow<string>('LDAP_USER_BASE_DN');

    this.adminClient = new Client({
      url: this.configService.getOrThrow<string>('LDAP_URL'),
    });
  }

  /**
   * Tenta autenticar o usuário contra o servidor LDAP.
   * @param enrollment O UID do usuário (ex: 'joao').
   * @param password A senha do usuário.
   * @returns Os atributos essenciais do usuário para o JWT, se a autenticação for bem-sucedida.
   */
  async authenticate(
    enrollment: string,
    password: string,
  ): Promise<UserPayload> {
    if (!password) {
      throw new UnauthorizedException('A senha não pode ser vazia.');
    }

    // 1. Encontrar o DN Completo do Usuário
    const userDN = await this.findUserDn(enrollment);
    const cleanPassword = password.trim();
    if (!userDN) {
      throw new UnauthorizedException(
        'Usuário não encontrado no diretório LDAP.',
      );
    }

    const userClient = new Client({
      url: this.configService.getOrThrow<string>('LDAP_URL'),
    });

    try {
      await userClient.bind(userDN, cleanPassword);
      const userAttributes: UserPayload = await this.getUserAttributes(userDN);

      return {
        uid: userAttributes.uid,
        displayName: userAttributes.displayName,
        mail: userAttributes.mail,
      };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: unknown }).code === 49
      ) {
        throw new UnauthorizedException('Credenciais LDAP inválidas.');
      }
      console.error('LDAP Connection or Binding Error:', error);
      throw new InternalServerErrorException(
        'Erro ao se comunicar com o servidor LDAP.',
      );
    } finally {
      await userClient
        .unbind()
        .catch((e) =>
          console.warn(
            'User client unbind error:',
            e &&
              typeof e === 'object' &&
              typeof (e as { message?: unknown }).message === 'string'
              ? (e as { message: string }).message
              : e,
          ),
        );
    }
  }

  getJwtToken(payload: UserPayload, expiresIn: string = '1d'): string {
    const jwtPayload = {
      sub: payload.uid,
      email: payload.mail,
      name: payload.displayName,
    };

    return this.jwtService.sign(jwtPayload, {
      expiresIn: expiresIn,
      algorithm: 'HS256',
    });
  }

  private async findUserDn(cpf: string): Promise<string | null> {
    const adminDn = this.configService.getOrThrow<string>('LDAP_ADMIN_DN');
    const adminPassword = this.configService.getOrThrow<string>(
      'LDAP_ADMIN_PASSWORD',
    );

    const adminClient = new Client({
      url: this.configService.getOrThrow<string>('LDAP_URL'),
    });

    try {
      await adminClient.bind(adminDn, adminPassword);

      const searchOptions = {
        filter: `(uid=${cpf})`,
        scope: 'sub' as const,
        attributes: ['dn'],
      };

      const { searchEntries } = await adminClient.search(
        this.userBaseDn,
        searchOptions,
      );

      return searchEntries.length > 0 ? searchEntries[0].dn : null;
    } catch (error) {
      console.error('LDAP Admin Bind or Search Error:', error);
      throw new InternalServerErrorException(
        'Erro de configuração LDAP: falha ao buscar DN do usuário.',
      );
    } finally {
      await adminClient
        .unbind()
        .catch((e) =>
          console.warn(
            'Admin client unbind error:',
            e &&
              typeof e === 'object' &&
              typeof (e as { message?: unknown }).message === 'string'
              ? (e as { message: string }).message
              : e,
          ),
        );
    }
  }

  private async getUserAttributes(userDN: string): Promise<UserPayload> {
    await this.adminClient.bind(
      this.configService.getOrThrow<string>('LDAP_ADMIN_DN'),
      this.configService.getOrThrow<string>('LDAP_ADMIN_PASSWORD'),
    );

    const { searchEntries } = await this.adminClient.search(userDN, {
      scope: 'base',
      attributes: ['cn', 'mail', 'uid', 'memberOf'],
    });

    await this.adminClient.unbind();

    if (searchEntries.length > 0) {
      const entry = searchEntries[0];
      return {
        uid: Array.isArray(entry.uid)
          ? String(entry.uid[0])
          : Buffer.isBuffer(entry.uid)
            ? entry.uid.toString()
            : String(entry.uid),
        displayName: Array.isArray(entry.cn)
          ? String(entry.cn[0])
          : Buffer.isBuffer(entry.cn)
            ? entry.cn.toString()
            : String(entry.cn),
        mail: Array.isArray(entry.mail)
          ? String(entry.mail[0])
          : Buffer.isBuffer(entry.mail)
            ? entry.mail.toString()
            : String(entry.mail),
      };
    }
    throw new InternalServerErrorException(
      'Atributos de usuário LDAP não encontrados após o BIND bem-sucedido.',
    );
  }
}
