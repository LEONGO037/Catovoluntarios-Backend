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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import type { RequestUser } from '../../common/decorators/get-user.decorator';

@Controller('ubicacion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UbicacionController {
  constructor(private readonly ubicacionService: UbicacionService) {}

  @Get('postulantes-admitidos')
  @Roles('ADMIN_PASTORAL', 'CATOLIDER')
  getPostulantesAdmitidos(@Query() filter: FilterPostulantesAdmitidosDto) {
    return this.ubicacionService.getPostulantesAdmitidosSinUbicar(filter);
  }

  @Get('proyectos/:idProyecto/voluntarios')
  @Roles('ADMIN_PASTORAL', 'CATOLIDER')
  getVoluntariosPorProyecto(
    @Param('idProyecto', ParseIntPipe) idProyecto: number,
  ) {
    return this.ubicacionService.getVoluntariosPorProyecto(idProyecto);
  }

  @Get('proyectos/:idProyecto/balance-demografico')
  @Roles('ADMIN_PASTORAL', 'CATOLIDER')
  getBalanceDemografico(@Param('idProyecto', ParseIntPipe) idProyecto: number) {
    return this.ubicacionService.getBalanceDemografico(idProyecto);
  }

  @Post('asignar')
  @Roles('ADMIN_PASTORAL')
  asignarUbicacion(@Body() dto: AsignarUbicacionDto) {
    return this.ubicacionService.asignarUbicacion(dto);
  }

  @Delete('asignaciones/:id')
  @Roles('ADMIN_PASTORAL')
  bajaUbicacion(@Param('id', ParseIntPipe) id: number) {
    return this.ubicacionService.bajaUbicacion(id);
  }

  @Post('reasignar')
  @Roles('ADMIN_PASTORAL')
  reasignarUbicacion(
    @Body() dto: ReasignarUbicacionDto,
    @GetUser() user: RequestUser,
  ) {
    return this.ubicacionService.reasignarUbicacion(dto, user?.id);
  }

  @Get('reasignaciones/historial')
  @Roles('ADMIN_PASTORAL', 'CATOLIDER')
  getHistorialReasignaciones(
    @Query('id_proyecto') idProyecto?: string,
    @Query('id_usuario') idUsuario?: string,
  ) {
    const proyectoId = idProyecto ? parseInt(idProyecto, 10) : undefined;
    const usuarioId = idUsuario ? parseInt(idUsuario, 10) : undefined;
    return this.ubicacionService.getHistorialReasignaciones(
      proyectoId,
      usuarioId,
    );
  }

  @Get('notificaciones')
  @Roles('ADMIN_PASTORAL', 'CATOLIDER', 'VOLUNTARIO')
  getNotificaciones(@Query() query: NotificacionQueryDto) {
    return this.ubicacionService.getNotificaciones(query);
  }

  @Patch('notificaciones/:id/marcar-leida')
  @Roles('ADMIN_PASTORAL', 'CATOLIDER', 'VOLUNTARIO')
  marcarNotificacionLeida(@Param('id', ParseIntPipe) id: number) {
    return this.ubicacionService.marcarNotificacionLeida(id);
  }

  @Patch('asignaciones/:id/estado-documental')
  @Roles('ADMIN_PASTORAL')
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
