import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'Catovoluntarios UCB <onboarding@resend.dev>';
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    if (apiKey && apiKey !== 're_tu_api_key_aqui' && apiKey.startsWith('re_')) {
      this.resend = new Resend(apiKey);
      this.logger.log('📧 Servicio Resend inicializado correctamente con API Key.');
    } else {
      this.logger.warn(
        '⚠️ RESEND_API_KEY no configurada o en modo demo. Los correos se simularán en los logs de consola.',
      );
    }
  }

  async sendPasswordResetEmail(
    email: string,
    nombres: string,
    resetToken: string,
  ): Promise<boolean> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperación de Contraseña — Catovoluntarios UCB</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F7FA; margin: 0; padding: 24px; color: #1E293B; }
    .container { max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 64, 119, 0.08); border: 1px solid #DCE4EE; }
    .header { background-color: #004077; padding: 32px 24px; text-align: center; }
    .logo-badge { display: inline-block; background-color: #FFCC00; color: #004077; font-weight: 900; font-size: 18px; padding: 6px 14px; border-radius: 8px; margin-bottom: 8px; }
    .header h1 { color: #FFFFFF; font-size: 20px; margin: 0; font-weight: 800; letter-spacing: 0.5px; }
    .header p { color: #DBEAFE; font-size: 12px; margin: 4px 0 0; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 16px; font-weight: 700; color: #004077; margin-bottom: 12px; }
    .text { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn-reset { display: inline-block; background-color: #FFCC00; color: #004077; font-weight: 800; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px; box-shadow: 0 2px 6px rgba(255, 204, 0, 0.4); }
    .alert-box { background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #92400E; margin-bottom: 24px; }
    .token-box { background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 12px; word-break: break-all; color: #475569; }
    .footer { background-color: #F8FAFC; padding: 20px 24px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 11px; color: #64748B; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">CATOVOLUNTARIOS</div>
      <h1>Pastoral Universitaria UCB</h1>
      <p>Regional La Paz — Sistema Web de Voluntariado</p>
    </div>
    
    <div class="content">
      <div class="greeting">Estimado/a ${nombres},</div>
      <p class="text">
        Hemos recibido una solicitud para restablecer la contraseña de acceso a tu cuenta en el Sistema de Catovoluntarios.
      </p>
      
      <div class="btn-container">
        <a href="${resetUrl}" target="_blank" class="btn-reset">
          Restablecer mi Contraseña
        </a>
      </div>
      
      <div class="alert-box">
        <strong>⚠️ Importante por seguridad:</strong> Este enlace tiene una validez estricta de <strong>15 minutos</strong>. Si tú no realizaste esta solicitud, puedes ignorar este correo de forma segura; tu contraseña actual continuará protegida.
      </div>

      <p class="text" style="font-size: 12px; color: #64748B;">
        Si tienes problemas con el botón, copia y pega el siguiente enlace directo en tu navegador:
      </p>
      <div class="token-box">${resetUrl}</div>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 6px;">Universidad Católica Boliviana "San Pablo" — Regional La Paz</p>
      <p style="margin: 0;">Oficina de Pastoral Universitaria | Soporte: pastoral.lapaz@ucb.edu.bo</p>
    </div>
  </div>
</body>
</html>
    `;

    if (this.resend) {
      try {
        const result = await this.resend.emails.send({
          from: this.fromEmail,
          to: [email],
          subject: 'Recuperación de Contraseña — Catovoluntarios Pastoral UCB',
          html: htmlContent,
        });

        if (result.error) {
          this.logger.error(
            `Error devuelto por la API de Resend para [${email}]: ${JSON.stringify(result.error)}`,
          );
          return false;
        }

        this.logger.log(`✅ Correo de reseteo enviado con Resend a [${email}]. ID: ${result.data?.id}`);
        return true;
      } catch (error) {
        this.logger.error(`Error de red o excepción al llamar a Resend para [${email}]:`, error);
        return false;
      }
    } else {
      // Modo simulación de desarrollo
      this.logger.log('----------------------------------------------------');
      this.logger.log(`[SIMULACIÓN RESEND] Envío a: ${email}`);
      this.logger.log(`[SIMULACIÓN RESEND] Enlace de reseteo: ${resetUrl}`);
      this.logger.log(`[SIMULACIÓN RESEND] Token temporal: ${resetToken}`);
      this.logger.log('----------------------------------------------------');
      return true;
    }
  }
}
