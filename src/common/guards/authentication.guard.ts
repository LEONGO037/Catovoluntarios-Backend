import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestUser } from '../decorators/get-user.decorator';

interface SessionPayload {
  sub: number;
  email: string;
  rol: string;
  nombres?: string;
  ci?: string;
  purpose?: string;
}

/**
 * Guard global (APP_GUARD). Se ejecuta antes que los guards de cada controlador.
 *
 * - Si la petición trae `Authorization: Bearer <token>`, verifica la FIRMA y la expiración
 *   del JWT y carga `request.user`. Un token inválido responde 401 (salvo en rutas @Public).
 * - Si no trae token, deja pasar la petición como anónima (`request.user` vacío). Las rutas
 *   protegidas lo rechazan después en `JwtAuthGuard` o `RolesGuard`.
 *
 * Así las rutas abiertas por diseño (login, formulario público de postulación) siguen
 * funcionando sin sesión, y ninguna ruta protegida acepta tokens falsificados.
 */
@Injectable()
export class AuthenticationGuard implements CanActivate {
  private readonly jwt: JwtService;

  constructor(
    private readonly reflector: Reflector,
    configService: ConfigService,
  ) {
    this.jwt = new JwtService({
      secret:
        configService.get<string>('JWT_SECRET') ||
        'super_secret_catovoluntarios_jwt_key_ucb_2026',
    });
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: RequestUser;
    }>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const header = request.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      return true;
    }

    try {
      const payload = this.jwt.verify<SessionPayload>(header.substring(7));
      // Los tokens de recuperación de contraseña no son tokens de sesión.
      if (!payload?.sub || payload.purpose) {
        throw new Error('Token sin sesión');
      }
      request.user = {
        id: payload.sub,
        email: payload.email,
        rol: payload.rol,
        nombres: payload.nombres,
        ci: payload.ci,
      };
      return true;
    } catch {
      if (isPublic) {
        return true;
      }
      throw new UnauthorizedException('Token de acceso inválido o expirado');
    }
  }
}
