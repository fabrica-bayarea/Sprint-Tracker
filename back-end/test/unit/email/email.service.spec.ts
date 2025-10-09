import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import * as nodemailer from 'nodemailer';


describe('EmailService', () => {
  let service: EmailService;
  //let transporterMock: any;

  const mockTransporter = {
    createTransport : jest.fn(),
    sendMail : jest.fn(),
    loadTemplate : jest.fn(),
  };

  const mockEmailService = {
    readFileSync : jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [],
      providers: [{ provide: EmailService, useValue: mockEmailService }],

    }).compile();

    service = module.get<EmailService>(EmailService);
  });


  it('deve ser criado corretamente', () => {
    expect(service).toBeDefined();
  });

  it('deve enviar email de recuperação de senha com sucesso', async () => {
    mockTransporter.sendMail.mockResolvedValueOnce({});

    const to = 'teste@teste.com';
    const code = '123456';

    await expect(service.sendForgotPasswordEmail(to, code)).resolves.toBeUndefined();

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to,
        subject: 'Recuperação de senha',
        html: expect.stringContaining(code),
        attachments: expect.any(Array),
      }),
    );
  });

  it('deve lançar erro ao configurar o transporter', () => {
    // Forçar erro na criação do transporter
    (nodemailer.createTransport as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Erro na configuração');
    });

    expect(() => new EmailService()).toThrow(InternalServerErrorException);
  });

  it('deve lançar erro ao carregar o template', () => {
    // Mock para falhar ao ler arquivo
    (mockEmailService.readFileSync as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Erro ao ler arquivo');
    });

    expect(() => (service as any).loadTemplate('nome-inexistente.html')).toThrow(
      InternalServerErrorException,
    );
  });

  it('deve lançar erro ao enviar o email', async () => {
    mockTransporter.sendMail.mockRejectedValueOnce(new Error('Falha ao enviar'));

    const to = 'teste@teste.com';
    const code = '123456';

    await expect(service.sendForgotPasswordEmail(to, code)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});