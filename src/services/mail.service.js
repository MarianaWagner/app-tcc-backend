import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

export class MailService {
  constructor() {
    // Configurar transporter baseado nas variáveis de ambiente
    // Em desenvolvimento, usar Mailtrap ou similar
    // Em produção, usar SMTP real (Gmail, SES, SendGrid, etc.)
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Verificar se há configuração SMTP nas variáveis de ambiente
    if (ENV.SMTP_HOST && ENV.SMTP_PORT) {
      this.transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port: Number(ENV.SMTP_PORT),
        secure: ENV.SMTP_SECURE === 'true', // true para 465, false para outras portas
        auth: ENV.SMTP_USER && ENV.SMTP_PASS ? {
          user: ENV.SMTP_USER,
          pass: ENV.SMTP_PASS,
        } : undefined,
      });
    } else if (ENV.SMTP_URL) {
      // URL completa do SMTP (ex: smtp://user:pass@host:port)
      this.transporter = nodemailer.createTransport(ENV.SMTP_URL);
    } else {
      // Modo desenvolvimento: usar Ethereal Email (temporário) ou console.log
      console.warn('⚠️  SMTP não configurado. Emails serão apenas logados no console.');
      this.transporter = {
        sendMail: async (options) => {
          console.log('📧 Email (desenvolvimento):', {
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html,
          });
          return { messageId: 'dev-' + Date.now(), accepted: [options.to] };
        },
      };
    }
  }

  /**
   * Envia código OTP por email
   * @param {string} to - Email do destinatário
   * @param {string} code - Código OTP de 6 dígitos
   * @param {string} examName - Nome do exame compartilhado
   */
  async sendVerificationCode(to, code, examName = 'um exame') {
    const subject = 'Código de verificação - Compartilhamento de exame';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .code { background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; }
          .warning { color: #d9534f; font-size: 14px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Código de Verificação</h2>
          <p>Você solicitou acesso ao exame compartilhado: <strong>${examName}</strong></p>
          <p>Use o código abaixo para verificar seu acesso:</p>
          <div class="code">${code}</div>
          <p class="warning">⚠️ Este código expira em 10 minutos e é válido por apenas 5 tentativas.</p>
          <p>Se você não solicitou este código, ignore este email.</p>
        </div>
      </body>
      </html>
    `;

    const text = `
Código de Verificação

Você solicitou acesso ao exame compartilhado: ${examName}

Use o código abaixo para verificar seu acesso:

${code}

⚠️ Este código expira em 10 minutos e é válido por apenas 5 tentativas.

Se você não solicitou este código, ignore este email.
    `;

    try {
      const info = await this.transporter.sendMail({
        from: ENV.SMTP_FROM || ENV.SMTP_USER || 'noreply@exams.app',
        to,
        subject,
        text,
        html,
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw new Error('Falha ao enviar email de verificação');
    }
  }

  /**
   * Envia email com link de compartilhamento de exames
   * @param {string} to - Email do destinatário
   * @param {string} shareUrl - URL completa do link compartilhado
   * @param {Array} exams - Array de exames compartilhados
   * @param {string} expiresAt - Data de expiração (ISO string)
   * @param {string} message - Mensagem opcional do remetente
   */
  async sendShareLinkEmail(to, shareUrl, exams = [], expiresAt = null, message = null) {
    const examCount = exams.length;
    const examList = exams.map((exam, index) => {
      const date = exam.examDate ? new Date(exam.examDate).toLocaleDateString('pt-BR') : 'Data não informada';
      return `
        <div style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-left: 4px solid #007bff; border-radius: 4px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${exam.name || `Exame ${index + 1}`}</h3>
          <p style="margin: 5px 0; color: #666;"><strong>Data:</strong> ${date}</p>
          ${exam.notes ? `<p style="margin: 5px 0; color: #666;"><strong>Observações:</strong> ${exam.notes}</p>` : ''}
        </div>
      `;
    }).join('');

    const expiresInfo = expiresAt 
      ? `<p style="color: #d9534f; margin-top: 20px;"><strong>⚠️ Importante:</strong> Este link expira em ${new Date(expiresAt).toLocaleDateString('pt-BR')}.</p>`
      : '';

    const subject = examCount === 1 
      ? `Exame compartilhado: ${exams[0]?.name || 'Exame'}`
      : `${examCount} exames compartilhados`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background: #0056b3; }
          .info-box { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Exames Compartilhados</h2>
          ${message ? `<div class="info-box"><p><strong>Mensagem do remetente:</strong><br>${message}</p></div>` : ''}
          <p>Você recebeu um compartilhamento de ${examCount === 1 ? '1 exame' : `${examCount} exames`}.</p>
          
          ${examList}
          
          <p style="margin-top: 30px;">Clique no botão abaixo para acessar os exames:</p>
          <a href="${shareUrl}" class="button" style="color: white; text-decoration: none;">Acessar Exames</a>
          
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            Ou copie e cole o link abaixo no seu navegador:<br>
            <a href="${shareUrl}" style="color: #007bff; word-break: break-all;">${shareUrl}</a>
          </p>
          
          ${expiresInfo}
          
          <p style="margin-top: 30px; font-size: 12px; color: #999;">
            Este link foi enviado através do sistema de compartilhamento de exames.
            Se você não esperava receber este email, pode ignorá-lo.
          </p>
        </div>
      </body>
      </html>
    `;

    const text = `
Exames Compartilhados

${message ? `Mensagem do remetente:\n${message}\n\n` : ''}
Você recebeu um compartilhamento de ${examCount === 1 ? '1 exame' : `${examCount} exames`}:

${exams.map((exam, index) => {
  const date = exam.examDate ? new Date(exam.examDate).toLocaleDateString('pt-BR') : 'Data não informada';
  return `${index + 1}. ${exam.name || `Exame ${index + 1}`}
   Data: ${date}${exam.notes ? `\n   Observações: ${exam.notes}` : ''}`;
}).join('\n\n')}

Acesse os exames através do link:
${shareUrl}

${expiresAt ? `⚠️ IMPORTANTE: Este link expira em ${new Date(expiresAt).toLocaleDateString('pt-BR')}.` : ''}

Este link foi enviado através do sistema de compartilhamento de exames.
Se você não esperava receber este email, pode ignorá-lo.
    `;

    try {
      const info = await this.transporter.sendMail({
        from: ENV.SMTP_FROM || ENV.SMTP_USER || 'noreply@exams.app',
        to,
        subject,
        text,
        html,
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Erro ao enviar email de compartilhamento:', error);
      throw new Error('Falha ao enviar email de compartilhamento');
    }
  }

  /**
   * Verifica se o serviço de email está configurado
   */
  isConfigured() {
    return this.transporter !== null && this.transporter !== undefined;
  }
}

