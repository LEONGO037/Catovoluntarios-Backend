import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestUser } from '../decorators/get-user.decorator';

/**
 * Exige una sesión válida. La verificación de la firma del JWT la hace el guard global
 * `AuthenticationGuard`; aquí solo se comprueba que haya un usuario autenticado.
 * Las rutas marcadas con @Public() quedan abiertas.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    if (!request.user) {
      throw new UnauthorizedException('Debes iniciar sesión para acceder a este recurso');
    }
    return true;
  }
}
