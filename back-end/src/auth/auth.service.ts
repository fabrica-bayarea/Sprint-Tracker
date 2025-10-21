import { randomBytes } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import * as argon2 from 'argon2';

import { ChangePasswordDto } from '@/auth/dto/change-password.dto';
import 'dotenv/config';
import { VerifyResetCodeDto } from '@/auth/dto/verify-reset-code.dto';
import { ForgotPasswordDto } from '@/email/dto/forgot-password.dto';
import { EmailService } from '@/email/email.service';
import { PrismaService } from '@/prisma/prisma.service';
import { SignInDto } from './dto/signin.dto';
import { SignUpDto } from './dto/signup.dto';
import { AccessTokenPayload } from './interface/jwt';
import { Client } from 'ldapts';

interface LdapUserPayload {
  uid: string;
  displayName: string;
  mail: string;
}

@Injectable()
export class AuthService {
  private adminClient: Client;
  private userBaseDn: string;
  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService,
    private configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.userBaseDn =
      this.configService.getOrThrow<string>('LDAP_USER_BASE_DN');

    this.adminClient = new Client({
      url: this.configService.getOrThrow<string>('LDAP_URL'),
    });
  }

  /**
   * Gera um token JWT com base no payload fornecido.
   */
  private generateJwt(user: User, rememberMe = false): { accessToken: string } {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      userName: user.userName,
    };
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: rememberMe ? '30d' : '1d',
        algorithm: 'HS256',
      }),
    };
  }

  /**
   * Gera um hash seguro para a senha usando Argon2.
   */
  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  /**
   * Busca um usuário pelo email ou cria um novo, dependendo do provedor de autentica-
   * ção é guardado o providerId em vez da senha.
   */
  private async findOrCreateUser(
    data: {
      email: string;
      name: string;
      providerId?: string;
      password?: string;
    },
    provider: string,
  ): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!existingUser) {
      const userData = {
        email: data.email,
        name: data.name,
        userName: data.email.split('@')[0],
        passwordHash: provider === 'local' ? data.password! : data.providerId!,
        providerId: provider === 'local' ? null : data.providerId!,
        role: 'ADMIN' as const,
        authProvider: provider as 'local' | 'google' | 'microsoft' | 'ldap',
      };

      const newUser = await this.prisma.user.create({
        data: userData,
      });
      return newUser;
    }

    return existingUser;
  }

  /**
   * Trata erros específicos ao criar um usuário.
   */
  private handleSignUpError(error: unknown): never {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Email ou nome de usuário já estão em uso');
    }
    if (error instanceof PrismaClientValidationError) {
      console.error('PrismaClientValidationError:', error.message);
      throw new BadRequestException('Dados de entrada inválidos fornecidos.');
    }
    throw new BadRequestException('Erro ao criar usuário');
  }

  /**
   * Registra um novo usuário localmente.
   */
  async signUp(dto: SignUpDto): Promise<{ accessToken: string }> {
    const hashedPassword = await this.hashPassword(dto.password);

    const existingUserByEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Email ou nome de usuário já estão em uso');
    }

    const existingUserByUserName = await this.prisma.user.findUnique({
      where: { userName: dto.userName },
    });

    if (existingUserByUserName) {
      throw new ConflictException('Email ou nome de usuário já estão em uso');
    }

    try {
      const user = await this.findOrCreateUser(
        { ...dto, password: hashedPassword },
        'local',
      );
      return this.generateJwt(user);
    } catch (error) {
      this.handleSignUpError(error);
    }
  }

  /**
   * Realiza login de um usuário local.
   */
  async signIn(dto: SignInDto): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    const isInvalidCredentials =
      !user ||
      !user.passwordHash ||
      user.authProvider !== 'local' ||
      !(await argon2.verify(user.passwordHash, dto.password));

    if (isInvalidCredentials) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.generateJwt(user, dto.rememberMe);
  }

  /**
   * Realiza login com um provedor externo (Google, Microsoft, etc.).
   */
  async signInWithProvider(
    provider: string,
    req: { providerId: string; email: string; name: string },
  ): Promise<{ accessToken: string }> {
    if (!req.email) {
      throw new ForbiddenException(`No user from ${provider}`);
    }

    const user = await this.findOrCreateUser(req, provider);

    return this.generateJwt(user);
  }

  /**
   * Gera um código aleatório e envia por email para recuperação de senha.
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      return;
    }

    const code = randomBytes(6).toString('base64');
    const expires = new Date(Date.now() + 1000 * 60 * 15);

    await this.prisma.user.update({
      where: { email: forgotPasswordDto.email },
      data: {
        resetToken: code,
        resetTokenExpiresAt: expires,
      },
    });

    await this.emailService.sendForgotPasswordEmail(
      forgotPasswordDto.email,
      code,
    );
  }

  /**
   * Verifica se o código de recuperação de senha é válido e gera um token JWT.
   */
  async verifyResetCode(
    verifyResetCodeDto: VerifyResetCodeDto,
  ): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { resetToken: verifyResetCodeDto.code },
    });

    if (!user) {
      throw new UnauthorizedException('Código inválido ou expirado.');
    }

    if (!user.resetToken || user.resetToken !== verifyResetCodeDto.code) {
      throw new UnauthorizedException('Código de verificação inválido.');
    }

    if (user.resetTokenExpiresAt && user.resetTokenExpiresAt < new Date()) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiresAt: null,
        },
      });
      throw new UnauthorizedException('Código de verificação expirado.');
    }

    const payload = {
      userId: user.id,
      email: user.email,
      purpose: 'reset-password',
    };

    const resetJwtToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: this.configService.get('JWT_RESET_SECRET'),
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    return resetJwtToken;
  }

  /**
   * Valida um usuário a partir de um token JWT.
   */
  async validateUserFromToken(token: string): Promise<User | null> {
    try {
      const decoded = this.jwtService.verify<AccessTokenPayload>(token);
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });
      return user || null;
    } catch {
      return null;
    }
  }

  /**
   * Redefine a senha de um usuário usando o ID do usuário e a nova senha.
   */
  async resetPassword(userId: string, newPasswordPlain: string): Promise<void> {
    try {
      const hashedPassword = await this.hashPassword(newPasswordPlain);

      await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
      });
    } catch (error) {
      throw new BadRequestException(
        'Erro ao redefinir a senha: ' + String(error),
      );
    }
  }

  /**
   * Altera a senha de um usuário após validar a senha atual.
   */
  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }

    const isOldPasswordValid = await argon2.verify(
      user.passwordHash,
      dto.oldPassword,
    );
    if (!isOldPasswordValid) {
      throw new BadRequestException('Senha antiga incorreta.');
    }

    const hashedNewPassword = await argon2.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: hashedNewPassword },
    });
  }

  /**
   * Tenta autenticar o usuário contra o servidor LDAP (usando a Matrícula/Identificador).
   * @param enrollment A matrícula ou identificador para busca no LDAP.
   * @param password A senha do usuário.
   * @returns Os atributos essenciais do usuário.
   */
  async authenticateLdap(
    enrollment: string,
    password: string,
  ): Promise<LdapUserPayload> {
    if (!password) {
      throw new UnauthorizedException('A senha não pode ser vazia.');
    }

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

      const userAttributes: LdapUserPayload =
        await this.getUserAttributes(userDN);

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
      await userClient.unbind().catch(() => {});
    }
  }

  private async findUserDn(enrollment: string): Promise<string | null> {
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
        filter: `(uid=${enrollment})`,
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
      await adminClient.unbind().catch(() => {});
    }
  }

  private async getUserAttributes(userDN: string): Promise<LdapUserPayload> {
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
