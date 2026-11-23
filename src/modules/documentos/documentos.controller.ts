import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentosService } from './documentos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';
import { UploadDocumentoDto } from './dtos/upload-documento.dto';
import { ValidarDocumentoDto } from './dtos/validar-documento.dto';
import { CreateSesionInduccionDto } from './dtos/create-sesion-induccion.dto';
import { RegistrarAsistenciaInduccionDto } from './dtos/registrar-asistencia.dto';

@Controller('documentos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Get('mis-documentos')
  @Roles(Role.VOLUNTARIO, Role.POSTULANTE, Role.CATOLIDER, Role.ADMIN_PASTORAL)
  async obtenerMisDocumentos(@CurrentUser() user: any) {
    return this.documentosService.obtenerMisDocumentos(user.id);
  }

  @Post('upload')
  @Roles(Role.VOLUNTARIO, Role.POSTULANTE, Role.CATOLIDER, Role.ADMIN_PASTORAL)
  @UseInterceptors(FileInterceptor('file'))
  async subirDocumento(
    @CurrentUser() user: any,
    @Body() dto: UploadDocumentoDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10 MB límite
          new FileTypeValidator({
            fileType: /(pdf|jpg|jpeg|png|webp|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)$/i,
          }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return this.documentosService.subirDocumento(user.id, dto, file);
  }

  @Delete(':id')
  @Roles(Role.VOLUNTARIO, Role.POSTULANTE, Role.CATOLIDER, Role.ADMIN_PASTORAL)
  async eliminarDocumento(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.documentosService.eliminarDocumento(id, user);
  }

  @Public()
  @Get('modelo-carta-menores')
  async obtenerModeloCartaMenores() {
    return this.documentosService.obtenerModeloCartaMenores();
  }

  @Get('bandeja-validacion')
  @Roles(Role.ADMIN_PASTORAL)
  async obtenerBandejaValidacion() {
    return this.documentosService.obtenerBandejaValidacion();
  }

  @Patch(':id/validar')
  @Roles(Role.ADMIN_PASTORAL)
  async validarDocumento(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: any,
    @Body() dto: ValidarDocumentoDto,
  ) {
    return this.documentosService.validarDocumento(id, admin.id, dto);
  }

  @Get('induccion/sesiones')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  async obtenerSesiones(@Query('semestre') semestre?: string) {
    return this.documentosService.obtenerSesionesInduccion(semestre);
  }

  @Post('induccion/sesiones')
  @Roles(Role.ADMIN_PASTORAL)
  async crearSesion(@Body() dto: CreateSesionInduccionDto) {
    return this.documentosService.crearSesionInduccion(dto);
  }

  @Get('induccion/participantes')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  async obtenerParticipantes(
    @Query('proyectoId') proyectoId?: string,
    @Query('estado') estado?: string,
  ) {
    return this.documentosService.obtenerParticipantesInduccion(
      proyectoId ? parseInt(proyectoId, 10) : undefined,
      estado,
    );
  }

  @Post('induccion/asistencia')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  async registrarAsistencia(@Body() dto: RegistrarAsistenciaInduccionDto) {
    return this.documentosService.registrarAsistenciaInduccion(dto);
  }
}
