import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import {
  AssignCatoliderDto,
  ResetCatolideresDto,
} from './dtos/assign-catolider.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser('id') userId: number) {
    const user = await this.usersService.findById(userId);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  @Get()
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  async findAll() {
    return this.usersService.findAll();
  }

  /**
   * Reseteo semestral exclusivo de Admin Pastoral (P-06B)
   */
  @Post('reset-catolideres')
  @Roles(Role.ADMIN_PASTORAL)
  async resetCatolideres(@Body() dto?: ResetCatolideresDto | { semestre?: string }) {
    return await this.usersService.resetCatolideres(dto as any);
  }

  /**
   * Asignación de rol Catolíder a voluntarios antiguos (P-06B)
   */
  @Post('assign-catolider')
  @Roles(Role.ADMIN_PASTORAL)
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
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  async getCatolideresVigentes() {
    return await this.usersService.getCatolideresVigentes();
  }

  /**
   * Listado de voluntarios candidatos para asumir liderazgo
   */
  @Get('voluntarios-elegibles')
  @Roles(Role.ADMIN_PASTORAL)
  async getVoluntariosElegibles() {
    return await this.usersService.getVoluntariosElegibles();
  }
}
