import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from '../../common/decorators/get-user.decorator';
import type { RequestUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AsistenciaService } from './asistencia.service';
import { PasajesService } from './pasajes.service';
import { PortalVoluntarioService } from './portal-voluntario.service';
import {
  ActualizarActividadEmergenteDto,
  AprobarAsistenciaDto,
  ConciliarMesDto,
  CrearActividadEmergenteDto,
  FiltroMesDto,
  FiltroProyectoMesDto,
  MarcarAsistenciaDto,
  ParticiparActividadEmergenteDto,
} from './dtos/asistencia.dto';

function mesActual(f: FiltroMesDto): { mes: number; anio: number } {
  const hoy = new Date();
  return { mes: f.mes ?? hoy.getMonth() + 1, anio: f.anio ?? hoy.getFullYear() };
}

/** M06 · P-16: registro de jornadas, aprobación del Catolíder y conciliación de Pastoral. */
@Controller('asistencia')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AsistenciaController {
  constructor(private readonly asistencia: AsistenciaService) {}

  @Post('marcar')
  @Roles(Role.VOLUNTARIO, Role.CATOLIDER)
  marcar(@GetUser() user: RequestUser, @Body() dto: MarcarAsistenciaDto) {
    return this.asistencia.marcar(user, dto);
  }

  @Get('mis-registros')
  @Roles(Role.VOLUNTARIO, Role.CATOLIDER)
  misRegistros(@GetUser() user: RequestUser, @Query() filtro: FiltroMesDto) {
    return this.asistencia.misRegistros(user.id, filtro.mes, filtro.anio);
  }

  @Get('proyectos')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  proyectos(@GetUser() user: RequestUser) {
    return this.asistencia.proyectosVisibles(user);
  }

  @Get('proyecto')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  registrosProyecto(@GetUser() user: RequestUser, @Query() filtro: FiltroProyectoMesDto) {
    const { mes, anio } = mesActual(filtro);
    return this.asistencia.registrosProyecto(user, filtro.proyectoId, mes, anio);
  }

  @Patch(':id/aprobar')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  aprobar(@GetUser() user: RequestUser, @Param('id', ParseIntPipe) id: number, @Body() dto: AprobarAsistenciaDto) {
    return this.asistencia.aprobar(user, id, dto);
  }

  @Post('conciliar')
  @Roles(Role.ADMIN_PASTORAL)
  @UseInterceptors(FileInterceptor('reporte'))
  conciliar(
    @GetUser() user: RequestUser,
    @Body() dto: ConciliarMesDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(pdf|jpg|jpeg|png|webp)$/i }),
        ],
        fileIsRequired: false,
      }),
    )
    reporte?: Express.Multer.File,
  ) {
    return this.asistencia.conciliar(user, dto, reporte);
  }

  @Get('actividades-emergentes')
  @Roles(Role.ADMIN_PASTORAL)
  listarEmergentes() {
    return this.asistencia.listarEmergentes();
  }

  @Post('actividades-emergentes')
  @Roles(Role.ADMIN_PASTORAL)
  crearEmergente(@GetUser() user: RequestUser, @Body() dto: CrearActividadEmergenteDto) {
    return this.asistencia.crearEmergente(user, dto);
  }

  @Patch('actividades-emergentes/:id')
  @Roles(Role.ADMIN_PASTORAL)
  actualizarEmergente(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarActividadEmergenteDto) {
    return this.asistencia.actualizarEmergente(id, dto);
  }
}

/** M06 · P-17: planillas contables de reposición de pasajes (exclusivo Pastoral). */
@Controller('pasajes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_PASTORAL)
export class PasajesController {
  constructor(private readonly pasajes: PasajesService) {}

  @Get('resumen')
  resumen(@Query() filtro: FiltroMesDto) {
    const { mes, anio } = mesActual(filtro);
    return this.pasajes.resumenMes(mes, anio);
  }

  @Get('planilla-macro')
  planillaMacro(@Query() filtro: FiltroProyectoMesDto) {
    const { mes, anio } = mesActual(filtro);
    return this.pasajes.planillaMacro(filtro.proyectoId, mes, anio);
  }

  @Get('planilla-individual/:voluntarioId')
  planillaIndividual(
    @Param('voluntarioId', ParseIntPipe) voluntarioId: number,
    @Query() filtro: FiltroMesDto,
    @Query('proyectoId') proyectoId?: string,
  ) {
    const { mes, anio } = mesActual(filtro);
    return this.pasajes.planillaIndividual(voluntarioId, mes, anio, proyectoId ? parseInt(proyectoId, 10) : undefined);
  }
}

/** M06 · P-18: portal operativo del Catovoluntario. */
@Controller('portal-voluntario')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.VOLUNTARIO, Role.CATOLIDER)
export class PortalVoluntarioController {
  constructor(
    private readonly portal: PortalVoluntarioService,
    private readonly asistencia: AsistenciaService,
  ) {}

  @Get('resumen')
  resumen(@GetUser() user: RequestUser) {
    return this.portal.resumen(user);
  }

  @Get('actividades-emergentes')
  actividades(@GetUser() user: RequestUser) {
    return this.asistencia.listarEmergentes(user.id, true);
  }

  @Post('actividades-emergentes')
  participar(@GetUser() user: RequestUser, @Body() dto: ParticiparActividadEmergenteDto) {
    return this.asistencia.participarEmergente(user, dto.actividadId);
  }
}
