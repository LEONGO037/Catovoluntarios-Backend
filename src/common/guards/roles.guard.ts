import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestUser } from '../decorators/get-user.decorator';
import { Role } from '../enums/role.enum';

/**
 * Control de acceso por rol (RBAC). El rol se toma SOLO del JWT verificado por
 * `AuthenticationGuard`; nunca de cabeceras enviadas por el cliente (x-role, x-user-rol).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(Role | string)[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0 || isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    if (!request.user) {
      throw new UnauthorizedException('Debes iniciar sesión para acceder a este recurso');
    }

    if (!requiredRoles.includes(request.user.rol)) {
      throw new ForbiddenException(
        `Acceso denegado: el rol '${request.user.rol}' no tiene permisos para esta acción (se requiere: ${requiredRoles.join(', ')})`,
      );
    }

    return true;
  }
}
