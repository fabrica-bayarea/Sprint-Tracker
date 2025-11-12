import * as fs from 'fs';
import * as path from 'path';

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor() {
    try {
      this.transporter = createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL!,
          pass: process.env.PASS!,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        'Erro ao configurar o serviço de e-mail. Verifique as credenciais.' +
          message,
      );
    }
  }

  getTransporter(): Transporter {
    return this.transporter;
  }

  private loadTemplate(templateName: string): string {
    const templateBaseDir = path.join(__dirname, 'templates');
    const filePath = path.join(templateBaseDir, templateName);
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch {
      throw new InternalServerErrorException(
        'Erro ao carregar o template de e-mail.',
      );
    }
  }

  async sendForgotPasswordEmail(to: string, code: string): Promise<void> {
    const html = this.loadTemplate('forgot-password.template.html').replace(
      '{{code}}',
      code,
    );

    try {
      await this.transporter.sendMail({
        from: `"Suporte Sprint Tracker" <${process.env.EMAIL!}>`,
        to,
        subject: 'Recuperação de senha',
        html,
        attachments: [
          {
            filename: 'bayarea-logo.png',
            path:
              process.env.NODE_ENV === 'production'
                ? 'dist/@/assets/bayarea-logo.png'
                : '@/assets/bayarea-logo.png',
            cid: 'bayarea-logo',
          },
          {
            filename: 'iesb-logo.png',
            path:
              process.env.NODE_ENV === 'production'
                ? 'dist/@/assets/iesb-logo.png'
                : '@/assets/iesb-logo.png',
            cid: 'iesb-logo',
          },
        ],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao enviar o e-mail de recuperação. Detalhes: ' + String(error),
      );
    }
  }
}
