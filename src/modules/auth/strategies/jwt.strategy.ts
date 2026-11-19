import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../../common/enums/role.enum';

export interface JwtPayload {
  sub: number;
  email: string;
  rol: Role;
  nombres: string;
  ci: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        'super_secret_catovoluntarios_jwt_key_ucb_2026',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token de acceso inválido o expirado');
    }
    return {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
      nombres: payload.nombres,
      ci: payload.ci,
    };
  }
}
