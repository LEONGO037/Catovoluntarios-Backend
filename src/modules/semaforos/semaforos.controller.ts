import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SemaforosService } from './semaforos.service';
import { CreateReporteSemaforoDto } from './dtos/create-reporte-semaforo.dto';
import { CreatePremioHistoricoDto } from './dtos/create-premio-historico.dto';
import { CreateFeedbackProyectoDto } from './dtos/create-feedback-proyecto.dto';
import { FilterBaseMadreDto } from './dtos/filter-base-madre.dto';
import { FilterSemaforoDto } from './dtos/filter-semaforo.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SemaforosController {
  constructor(private readonly semaforosService: SemaforosService) {}

  // =========================================================================
  // 1. ENDPOINTS DE REPORTES MENSUALES Y SEMÁFOROS (P-19)
  // =========================================================================

  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  @Post('semaforos/reporte-mensual')
  async guardarReporte(
    @Body() dto: CreateReporteSemaforoDto,
    @CurrentUser() user?: any,
  ) {
    const evaluadorId = user?.sub || user?.id || dto.catoliderEvaluadorId;
    return await this.semaforosService.guardarReporteSemaforo(dto, evaluadorId);
  }

  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  @Get('semaforos/proyecto/:proyectoId')
  async obtenerPorProyecto(
    @Param('proyectoId', ParseIntPipe) proyectoId: number,
    @Query() filter: FilterSemaforoDto,
  ) {
    return await this.semaforosService.obtenerReportesPorProyecto(
      proyectoId,
      filter.mes,
      filter.anio,
    );
  }

  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  @Get('semaforos/resumen-mes')
  async obtenerResumenMes(@Query() filter: FilterSemaforoDto) {
    return await this.semaforosService.obtenerResumenGeneralSemaforos(
      filter.mes,
      filter.anio,
    );
  }

  // =========================================================================
  // 2. ENDPOINTS DE BASE MADRE, PREMIOS Y RANKING RF-22 (P-20)
  // =========================================================================

  @Roles(Role.ADMIN_PASTORAL)
  @Get('base-madre')
  async obtenerBaseMadre(@Query() filter: FilterBaseMadreDto) {
    return await this.semaforosService.obtenerBaseMadre(filter);
  }

  @Roles(Role.ADMIN_PASTORAL)
  @Post('base-madre/premios')
  async crearPremio(@Body() dto: CreatePremioHistoricoDto) {
    return await this.semaforosService.crearPremio(dto);
  }

  @Roles(Role.ADMIN_PASTORAL)
  @Get('base-madre/premios/:usuarioId')
  async obtenerPremiosUsuario(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return await this.semaforosService.obtenerPremiosPorUsuario(usuarioId);
  }

  @Roles(Role.ADMIN_PASTORAL)
  @Get('base-madre/ranking')
  async obtenerRanking(@Query('semestre') semestre?: string) {
    return await this.semaforosService.obtenerRankingDestacados(semestre);
  }

  // =========================================================================
  // 3. ENDPOINTS DE FEEDBACK SEMESTRAL Y CERTIFICADOS (P-21)
  // =========================================================================

  // Público por diseño: lo llena el Proyecto Receptor con acceso simplificado (P-21).
  @Public()
  @Post('proyectos/feedback-semestral')
  async registrarFeedback(@Body() dto: CreateFeedbackProyectoDto) {
    return await this.semaforosService.registrarFeedbackProyecto(dto);
  }

  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  @Get('proyectos/:id/feedback-semestral')
  async obtenerFeedbackProyecto(
    @Param('id', ParseIntPipe) id: number,
    @Query('semestre') semestre?: string,
  ) {
    return await this.semaforosService.obtenerFeedbackProyecto(id, semestre);
  }

  @Roles(Role.ADMIN_PASTORAL)
  @Get('certificados/plantilla-datos/:usuarioId')
  async generarPlantillaCertificado(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Query('semestre') semestre?: string,
  ) {
    return await this.semaforosService.generarPlantillaCertificado(usuarioId, semestre);
  }

  @Roles(Role.ADMIN_PASTORAL)
  @Get('certificados/lote')
  async obtenerCertificadosLote(
    @Query('proyectoId') proyectoId?: string,
    @Query('semestre') semestre?: string,
  ) {
    const id = proyectoId ? parseInt(proyectoId, 10) : undefined;
    return await this.semaforosService.obtenerPlantillasLote(id, semestre);
  }
}
