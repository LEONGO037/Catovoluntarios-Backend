import { Role } from '../../../common/enums/role.enum';

/** Forma de request.user que entrega JwtStrategy (M01). */
export interface UsuarioAutenticado {
  id: number;
  email: string;
  rol: Role;
  nombres: string;
  ci: string;
}
