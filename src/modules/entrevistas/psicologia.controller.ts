import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  ActualizarEvaluacionPsicologicaDto,
  CrearEvaluacionPsicologicaDto,
  FiltroEvaluacionesDto,
} from './dtos/evaluacion-psicologica.dto';
import { PsicologiaService } from './psicologia.service';
import type { ArchivoSubido } from './psicologia.service';
import {
  EvaluacionListado,
  EvaluacionVista,
  FichaPsicologica,
  PostulanteEvaluable,
} from './types/respuestas.types';
import type { UsuarioAutenticado } from './types/usuario-autenticado';

/** Límite propuesto para el informe PDF (pendiente de confirmar con Pastoral). */
const TAMANO_MAXIMO_PDF = 10 * 1024 * 1024;
const subidaInforme = FileInterceptor('informe', { limits: { fileSize: TAMANO_MAXIMO_PDF, files: 1 } });

/** M03 — P-09 Evaluación Psicológica E-SRE. Confidencial: solo Administración Pastoral. */
@Controller('psicologia')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN_PASTORAL)
export class PsicologiaController {
  constructor(private readonly psicologiaService: PsicologiaService) {}

  @Get('postulantes')
  listarPostulantes(): Promise<PostulanteEvaluable[]> {
    return this.psicologiaService.listarPostulantes();
  }

  @Get('evaluaciones')
  listarEvaluaciones(@Query() filtro: FiltroEvaluacionesDto): Promise<EvaluacionListado[]> {
    return this.psicologiaService.listarEvaluaciones(filtro);
  }

  @Get('evaluacion/:postulacionId')
  obtenerFicha(@Param('postulacionId', ParseIntPipe) postulacionId: number): Promise<FichaPsicologica> {
    return this.psicologiaService.obtenerFicha(postulacionId);
  }

  @Post('evaluacion')
  @UseInterceptors(subidaInforme)
  crear(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: CrearEvaluacionPsicologicaDto,
    @UploadedFile() archivo?: ArchivoSubido,
  ): Promise<EvaluacionVista> {
    return this.psicologiaService.crear(usuario, dto, archivo);
  }

  @Patch('evaluacion/:id')
  @UseInterceptors(subidaInforme)
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarEvaluacionPsicologicaDto,
    @UploadedFile() archivo?: ArchivoSubido,
  ): Promise<EvaluacionVista> {
    return this.psicologiaService.actualizar(id, dto, archivo);
  }

  @Get('evaluacion/:id/informe')
  async descargarInforme(@Param('id', ParseIntPipe) id: number): Promise<StreamableFile> {
    const { contenido, nombre } = await this.psicologiaService.leerInforme(id);
    return new StreamableFile(contenido, {
      type: 'application/pdf',
      disposition: `inline; filename="${nombre}"`,
    });
  }
}
