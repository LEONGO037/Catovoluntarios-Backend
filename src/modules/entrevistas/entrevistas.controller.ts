import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  AgendarEntrevistaDto,
  CambiarEstadoCitaDto,
  CitasDelDiaQueryDto,
  DisponibilidadQueryDto,
  ReprogramarEntrevistaDto,
} from './dtos/agenda.dto';
import { RegistrarFichaEntrevistaDto } from './dtos/ficha-entrevista.dto';
import { EntrevistasService } from './entrevistas.service';
import {
  CitaVista,
  CitasDelDia,
  DetalleEntrevista,
  DisponibilidadSemanal,
  MiEntrevista,
} from './types/respuestas.types';
import type { UsuarioAutenticado } from './types/usuario-autenticado';

/** M03 — P-07 (agenda) y P-08 (ficha de entrevista). */
@Controller('entrevistas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EntrevistasController {
  constructor(private readonly entrevistasService: EntrevistasService) {}

  @Get('disponibilidad')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER, Role.POSTULANTE)
  disponibilidad(@Query() query: DisponibilidadQueryDto): Promise<DisponibilidadSemanal> {
    return this.entrevistasService.disponibilidad(query.semana);
  }

  @Post('agendar')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER, Role.POSTULANTE)
  agendar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: AgendarEntrevistaDto,
  ): Promise<CitaVista> {
    return this.entrevistasService.agendar(usuario, dto);
  }

  @Get('mi-entrevista')
  @Roles(Role.POSTULANTE)
  miEntrevista(@CurrentUser() usuario: UsuarioAutenticado): Promise<MiEntrevista> {
    return this.entrevistasService.miEntrevista(usuario);
  }

  @Get('fichas')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  listarFichas(@CurrentUser() usuario: UsuarioAutenticado): Promise<CitaVista[]> {
    return this.entrevistasService.listarFichas(usuario);
  }

  @Get()
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  citasDelDia(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Query() query: CitasDelDiaQueryDto,
  ): Promise<CitasDelDia> {
    return this.entrevistasService.citasDelDia(usuario, query.fecha);
  }

  @Get(':id')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  detalle(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DetalleEntrevista> {
    return this.entrevistasService.detalle(usuario, id);
  }

  @Patch(':id/estado')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  cambiarEstado(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoCitaDto,
  ): Promise<CitaVista> {
    return this.entrevistasService.cambiarEstado(usuario, id, dto);
  }

  @Patch(':id/reprogramar')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER, Role.POSTULANTE)
  reprogramar(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReprogramarEntrevistaDto,
  ): Promise<CitaVista> {
    return this.entrevistasService.reprogramar(usuario, id, dto);
  }

  @Post(':id/ficha')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  registrarFicha(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarFichaEntrevistaDto,
  ): Promise<DetalleEntrevista> {
    return this.entrevistasService.registrarFicha(usuario, id, dto);
  }
}
