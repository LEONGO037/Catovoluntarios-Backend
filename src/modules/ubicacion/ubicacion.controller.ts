import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UbicacionService } from './ubicacion.service';
import { AsignarUbicacionDto } from './dto/asignar-ubicacion.dto';
import { ReasignarUbicacionDto } from './dto/reasignar-ubicacion.dto';
import { FilterPostulantesAdmitidosDto } from './dto/filter-postulantes-admitidos.dto';
import { NotificacionQueryDto } from './dto/notificacion-query.dto';
import { UpdateEstadoDocumentalDto } from './dto/update-estado-documental.dto';
import { FilterHistorialReasignacionesDto } from './dto/filter-historial-reasignaciones.dto';
import { FilterGestionDto } from './dto/filter-gestion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';
import type { RequestUser } from '../../common/decorators/get-user.decorator';

@Controller('ubicacion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UbicacionController {
  constructor(private readonly ubicacionService: UbicacionService) {}

  @Get('postulantes-admitidos')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  getPostulantesAdmitidos(@Query() filter: FilterPostulantesAdmitidosDto) {
    return this.ubicacionService.getPostulantesAdmitidosSinUbicar(filter);
  }

  @Get('proyectos/:idProyecto/voluntarios')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER, Role.ENCARGADO_RECEPTOR)
  getVoluntariosPorProyecto(
    @Param('idProyecto', ParseIntPipe) idProyecto: number,
    @Query() filter: FilterGestionDto,
  ) {
    return this.ubicacionService.getVoluntariosPorProyecto(
      idProyecto,
      filter.semestre,
      filter.gestion,
    );
  }

  @Get('proyectos/:idProyecto/balance-demografico')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER, Role.ENCARGADO_RECEPTOR)
  getBalanceDemografico(
    @Param('idProyecto', ParseIntPipe) idProyecto: number,
    @Query() filter: FilterGestionDto,
  ) {
    return this.ubicacionService.getBalanceDemografico(
      idProyecto,
      filter.semestre,
      filter.gestion,
    );
  }

  @Post('asignar')
  @Roles(Role.ADMIN_PASTORAL)
  asignarUbicacion(@Body() dto: AsignarUbicacionDto) {
    return this.ubicacionService.asignarUbicacion(dto);
  }

  @Delete('asignaciones/:id')
  @Roles(Role.ADMIN_PASTORAL)
  bajaUbicacion(@Param('id', ParseIntPipe) id: number) {
    return this.ubicacionService.bajaUbicacion(id);
  }

  @Post('reasignar')
  @Roles(Role.ADMIN_PASTORAL)
  reasignarUbicacion(
    @Body() dto: ReasignarUbicacionDto,
    @GetUser() user: RequestUser,
  ) {
    return this.ubicacionService.reasignarUbicacion(dto, user?.id);
  }

  @Get('reasignaciones/historial')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  getHistorialReasignaciones(
    @Query() filter: FilterHistorialReasignacionesDto,
  ) {
    return this.ubicacionService.getHistorialReasignaciones(filter);
  }

  @Get('notificaciones')
  @Roles(
    Role.ADMIN_PASTORAL,
    Role.CATOLIDER,
    Role.VOLUNTARIO,
    Role.ENCARGADO_RECEPTOR,
  )
  getNotificaciones(@Query() query: NotificacionQueryDto) {
    return this.ubicacionService.getNotificaciones(query);
  }

  @Patch('notificaciones/:id/marcar-leida')
  @Roles(
    Role.ADMIN_PASTORAL,
    Role.CATOLIDER,
    Role.VOLUNTARIO,
    Role.ENCARGADO_RECEPTOR,
  )
  marcarNotificacionLeida(@Param('id', ParseIntPipe) id: number) {
    return this.ubicacionService.marcarNotificacionLeida(id);
  }

  @Patch('asignaciones/:id/estado-documental')
  @Roles(Role.ADMIN_PASTORAL)
  actualizarEstadoDocumental(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEstadoDocumentalDto,
  ) {
    return this.ubicacionService.actualizarEstadoDocumental(
      id,
      dto.poliza_validada,
      dto.induccion_completada,
    );
  }
}
