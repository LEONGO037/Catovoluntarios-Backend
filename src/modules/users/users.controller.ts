import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  AssignCatoliderDto,
  ResetCatolideresDto,
} from './dtos/assign-catolider.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RolUsuario } from './entities/user.entity';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Reseteo semestral exclusivo de Admin Pastoral (P-06B)
   */
  @Post('reset-catolideres')
  @Roles(RolUsuario.ADMIN_PASTORAL)
  async resetCatolideres(@Body() dto: ResetCatolideresDto) {
    return await this.usersService.resetCatolideres(dto);
  }

  /**
   * Asignación de rol Catolíder a voluntarios antiguos (P-06B)
   */
  @Post('assign-catolider')
  @Roles(RolUsuario.ADMIN_PASTORAL)
  async assignCatolider(@Body() dto: AssignCatoliderDto) {
    const user = await this.usersService.assignCatolider(dto);
    return {
      message: `Voluntario ${user.nombres} ${user.primerApellido} asignado exitosamente como Catolíder`,
      user,
    };
  }

  /**
   * Listado de Catolíderes activos en el semestre
   */
  @Get('catolideres-vigentes')
  @Roles(RolUsuario.ADMIN_PASTORAL, RolUsuario.CATOLIDER)
  async getCatolideresVigentes() {
    return await this.usersService.getCatolideresVigentes();
  }

  /**
   * Listado de voluntarios candidatos para asumir liderazgo
   */
  @Get('voluntarios-elegibles')
  @Roles(RolUsuario.ADMIN_PASTORAL)
  async getVoluntariosElegibles() {
    return await this.usersService.getVoluntariosElegibles();
  }
}
