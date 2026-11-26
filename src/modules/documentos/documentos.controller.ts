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
  DefaultValuePipe,
  StreamableFile,
  Header,
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
import { EnviarDocumentosDto } from './dtos/enviar-documentos.dto';
import { EstadoInduccion } from './entities/asistencia-induccion.entity';
import type { UsuarioDocumentos } from './documentos.service';

@Controller('documentos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Get('gestiones')
  @Roles(Role.VOLUNTARIO, Role.POSTULANTE, Role.CATOLIDER, Role.ADMIN_PASTORAL)
  gestiones() {
    return this.documentosService.obtenerGestiones();
  }

  @Get('mis-documentos')
  @Roles(Role.VOLUNTARIO, Role.POSTULANTE, Role.CATOLIDER, Role.ADMIN_PASTORAL)
  obtenerMisDocumentos(@CurrentUser() user: UsuarioDocumentos, @Query('semestre') semestre?: string) {
    return this.documentosService.obtenerMisDocumentos(user.id, semestre);
  }

  @Post('upload')
  @Roles(Role.VOLUNTARIO, Role.POSTULANTE, Role.CATOLIDER, Role.ADMIN_PASTORAL)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async subirDocumento(
    @CurrentUser() user: UsuarioDocumentos,
    @Body() dto: UploadDocumentoDto,
    @Query('semestre') semestre: string | undefined,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10 MB límite
          new FileTypeValidator({
            fileType: /(pdf|jpg|jpeg|png|webp|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)$/i,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.documentosService.subirDocumento(user.id, dto, file, semestre);
  }

  @Post('enviar-revision')
  @Roles(Role.VOLUNTARIO, Role.POSTULANTE, Role.CATOLIDER, Role.ADMIN_PASTORAL)
  enviarRevision(
    @CurrentUser() user: UsuarioDocumentos,
    @Body() dto: EnviarDocumentosDto,
    @Query('semestre') semestre?: string,
  ) {
    return this.documentosService.enviarRevision(user.id, dto.documentoIds, semestre);
  }

  @Get(':id/archivo')
  @Roles(Role.VOLUNTARIO, Role.POSTULANTE, Role.CATOLIDER, Role.ADMIN_PASTORAL)
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async archivo(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UsuarioDocumentos,
    @Query('semestre') semestre?: string,
  ) {
    const archivo = await this.documentosService.obtenerArchivo(id, user, semestre);
    return new StreamableFile(archivo.contenido, { type: archivo.mimeType });
  }

  @Delete(':id')
  @Roles(Role.VOLUNTARIO, Role.POSTULANTE, Role.CATOLIDER, Role.ADMIN_PASTORAL)
  async eliminarDocumento(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UsuarioDocumentos,
    @Query('semestre') semestre?: string,
  ) {
    return this.documentosService.eliminarDocumento(id, user, semestre);
  }

  @Public()
  @Get('modelo-carta-menores')
  async obtenerModeloCartaMenores() {
    return this.documentosService.obtenerModeloCartaMenores();
  }

  @Get('bandeja-validacion')
  @Roles(Role.ADMIN_PASTORAL)
  async obtenerBandejaValidacion(@Query('semestre') semestre?: string) {
    return this.documentosService.obtenerBandejaValidacion(semestre);
  }

  @Patch(':id/validar')
  @Roles(Role.ADMIN_PASTORAL)
  async validarDocumento(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() admin: UsuarioDocumentos,
    @Body() dto: ValidarDocumentoDto,
    @Query('semestre') semestre?: string,
  ) {
    return this.documentosService.validarDocumento(id, admin.id, dto, semestre);
  }

  @Get('induccion/sesiones')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  async obtenerSesiones(@CurrentUser() user: UsuarioDocumentos, @Query('semestre') semestre?: string) {
    return this.documentosService.obtenerSesionesInduccion(user, semestre);
  }

  @Get('induccion/proyectos')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  obtenerProyectos(@CurrentUser() user: UsuarioDocumentos, @Query('semestre') semestre?: string) {
    return this.documentosService.obtenerProyectosInduccion(user, semestre);
  }

  @Post('induccion/sesiones')
  @Roles(Role.ADMIN_PASTORAL)
  async crearSesion(
    @Body() dto: CreateSesionInduccionDto,
    @CurrentUser() user: UsuarioDocumentos,
    @Query('semestre') semestre?: string,
  ) {
    return this.documentosService.crearSesionInduccion(dto, user, semestre);
  }

  @Get('induccion/participantes')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  async obtenerParticipantes(
    @CurrentUser() user: UsuarioDocumentos,
    @Query('proyectoId', new DefaultValuePipe(0), ParseIntPipe) proyectoId: number,
    @Query('estado') estado?: EstadoInduccion,
    @Query('semestre') semestre?: string,
  ) {
    return this.documentosService.obtenerParticipantesInduccion(
      user,
      semestre,
      proyectoId || undefined,
      estado,
    );
  }

  @Post('induccion/asistencia')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  async registrarAsistencia(
    @Body() dto: RegistrarAsistenciaInduccionDto,
    @CurrentUser() user: UsuarioDocumentos,
    @Query('semestre') semestre?: string,
  ) {
    return this.documentosService.registrarAsistenciaInduccion(dto, user, semestre);
  }
}
