import { Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { IsOptional, Matches } from 'class-validator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NotificacionesService } from './notificaciones.service';

class FiltroNotificacionesDto {
  @IsOptional()
  @Matches(/^[12]\/\d{4}$/)
  semestre?: string;
}

@Controller('notificaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER, Role.VOLUNTARIO, Role.POSTULANTE)
export class NotificacionesController {
  constructor(private readonly notificaciones: NotificacionesService) {}

  @Get()
  listar(@GetUser('id') userId: number, @Query() filtro: FiltroNotificacionesDto) {
    return this.notificaciones.listar(userId, filtro.semestre);
  }

  @Patch(':id/leida')
  marcarLeida(@GetUser('id') userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.notificaciones.marcarLeida(userId, id);
  }
}
