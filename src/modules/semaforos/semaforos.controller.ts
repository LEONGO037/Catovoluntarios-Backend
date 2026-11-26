import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  @Post('base-madre/premios')
  async crearPremio(@Body() dto: CreatePremioHistoricoDto) {
    return await this.semaforosService.crearPremio(dto);
  }

  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER, Role.VOLUNTARIO)
  @Get('base-madre/premios/:usuarioId')
  async obtenerPremiosUsuario(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return await this.semaforosService.obtenerPremiosPorUsuario(usuarioId);
  }

  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER, Role.VOLUNTARIO)
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

  @Roles(Role.ADMIN_PASTORAL, Role.VOLUNTARIO)
  @Get('certificados/plantilla-datos/:usuarioId')
  async generarPlantillaCertificado(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Query('semestre') semestre?: string,
  ) {
    return await this.semaforosService.generarPlantillaCertificado(usuarioId, semestre);
  }

  @Roles(Role.ADMIN_PASTORAL, Role.VOLUNTARIO)
  @Get('certificados/oficial/:usuarioId')
  async obtenerCertificadoOficial(
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

  @Roles(Role.ADMIN_PASTORAL)
  @Get('certificados/oficial/lote')
  async obtenerCertificadosOficialesLote(
    @Query('proyectoId') proyectoId?: string,
    @Query('semestre') semestre?: string,
  ) {
    const id = proyectoId ? parseInt(proyectoId, 10) : undefined;
    return await this.semaforosService.obtenerPlantillasLote(id, semestre);
  }

  // =========================================================================
  // 4. CERTIFICADOS DE FUNDACIÓN (Subida de PDF por Encargado de Centro)
  // =========================================================================

  @Roles(Role.ADMIN_PASTORAL, Role.ENCARGADO_RECEPTOR, Role.SUPERVISOR_CENTRO)
  @Post('certificados/fundacion/upload')
  @UseInterceptors(FileInterceptor('file'))
  async subirCertificadoFundacion(
    @UploadedFile() file: Express.Multer.File,
    @Body('proyectoId', ParseIntPipe) proyectoId: number,
    @Body('usuarioId', ParseIntPipe) usuarioId: number,
    @Body('semestre') semestre?: string,
    @Body('observaciones') observaciones?: string,
    @CurrentUser() user?: any,
  ) {
    const subidoPor = user?.sub || user?.id;
    return await this.semaforosService.subirCertificadoFundacion(
      file,
      proyectoId,
      usuarioId,
      semestre || '2/2026',
      subidoPor,
      observaciones,
    );
  }

  @Roles(Role.ADMIN_PASTORAL, Role.ENCARGADO_RECEPTOR, Role.SUPERVISOR_CENTRO, Role.CATOLIDER)
  @Get('certificados/fundacion/proyecto/:proyectoId')
  async obtenerCertificadosFundacionProyecto(
    @Param('proyectoId', ParseIntPipe) proyectoId: number,
    @Query('semestre') semestre?: string,
  ) {
    return await this.semaforosService.obtenerCertificadosFundacionPorProyecto(proyectoId, semestre);
  }

  @Roles(Role.ADMIN_PASTORAL, Role.ENCARGADO_RECEPTOR, Role.SUPERVISOR_CENTRO, Role.VOLUNTARIO)
  @Get('certificados/fundacion/usuario/:usuarioId')
  async obtenerCertificadosFundacionUsuario(
    @Param('usuarioId', ParseIntPipe) usuarioId: number,
    @Query('semestre') semestre?: string,
  ) {
    return await this.semaforosService.obtenerCertificadosFundacionPorUsuario(usuarioId, semestre);
  }

  @Roles(Role.ADMIN_PASTORAL)
  @Get('certificados/fundacion')
  async listarCertificadosFundacion(
    @Query('semestre') semestre?: string,
    @Query('proyectoId') proyectoId?: string,
  ) {
    const pId = proyectoId ? parseInt(proyectoId, 10) : undefined;
    return await this.semaforosService.listarTodosCertificadosFundacion(semestre, pId);
  }

  @Roles(Role.ADMIN_PASTORAL, Role.ENCARGADO_RECEPTOR, Role.SUPERVISOR_CENTRO)
  @Delete('certificados/fundacion/:id')
  async eliminarCertificadoFundacion(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: any,
  ) {
    const subidoPor = user?.sub || user?.id;
    return await this.semaforosService.eliminarCertificadoFundacion(id, subidoPor);
  }
}
