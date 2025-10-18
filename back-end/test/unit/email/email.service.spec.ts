import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import { Attachment } from 'nodemailer/lib/mailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path: string;
    cid: string;
  }>;
}

const mockTransporter: { sendMail: jest.Mock<Promise<void>, [MailOptions]> } = {
  sendMail: jest.fn<Promise<void>, [MailOptions]>(),
};

jest.mock('nodemailer', () => {
  return {
    createTransport: jest.fn(),
  };
});

jest.mock('fs');
const mockedFs = fs as jest.Mocked <typeof fs>;

const attachment: Attachment[] = [
  {
    filename: 'bayarea-logo.png',
    path: process.env.NODE_ENV === 'production' ? 'dist/src/assets/bayarea-logo.png' : 'src/assets/bayarea-logo.png',
    cid: 'bayarea-logo',
  },
  {
    filename: 'iesb-logo.png',
    path: process.env.NODE_ENV === 'production' ? 'dist/src/assets/iesb-logo.png' : 'src/assets/iesb-logo.png',
    cid: 'iesb-logo',
  },
];

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [],
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  })

  describe ('Testes do transporter no constructor', () => {

    it('deve criar o transporter com sucesso', () => {
      
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL!,
          pass: process.env.PASS!,
        },
      });
    
      expect(service.getTransporter()).toBe(mockTransporter);
    });

    it('deve lançar erro ao configurar o transporter', () => {

      (nodemailer.createTransport as jest.Mock).mockImplementation(() => {
        throw new Error('Erro esperado');
      });
      
      expect(() => new EmailService()).toThrow(InternalServerErrorException);
    });
  });
  
  describe ('Testes do transporter no constructor', () => {

    it('deve enviar e-mail com sucesso ao ler o template com sucesso', async () => {

      (mockedFs.readFileSync as jest.Mock).mockReturnValue('<p>Seu código é {{code}}</p>');

      const to = 'teste@email.com';
      const code = '123456';
      await service.sendForgotPasswordEmail(to, code);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to,
          subject: 'Recuperação de senha',
          html: '<p>Seu código é 123456</p>',
          attachments: attachment,
        })
      );
    });

    it('deve lançar erro ao carregar o template', async () => {

      (mockedFs.readFileSync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Erro ao ler arquivo');
      });

      await expect(service.sendForgotPasswordEmail('teste@gmail.com', '123456'))
      .rejects.toThrow(InternalServerErrorException);
    });

 });


  describe ('Testes da função sendForgotPasswordEmail()', () => {
    
    it('deve enviar email de recuperação de senha com sucesso', async () => {
      mockTransporter.sendMail.mockResolvedValueOnce();

      const to = 'teste@teste.com';
      const code = '123456';

      await expect(service.sendForgotPasswordEmail(to, code)).resolves.toBeUndefined();

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to,
          subject: 'Recuperação de senha',
          html: expect.stringContaining(code),
          attachments: attachment,
        }),
      );
    });

    it('deve lançar erro ao enviar o email', async () => {
      
      mockTransporter.sendMail.mockClear();
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('Falha ao enviar'));

      const to = 'teste@teste.com';
      const code = '123456';

      await expect(service.sendForgotPasswordEmail(to, code)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

});