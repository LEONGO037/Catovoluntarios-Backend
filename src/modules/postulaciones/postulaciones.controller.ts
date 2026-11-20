import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PostulacionesService } from './postulaciones.service';
import { CreatePostulacionDto } from './dtos/create-postulacion.dto';
import { FilterPostulacionesDto } from './dtos/filter-postulaciones.dto';
import { UpdateEstadoPostulacionDto } from './dtos/update-estado-postulacion.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RolUsuario } from '../users/entities/user.entity';

@Controller('postulaciones')
@UseGuards(RolesGuard)
export class PostulacionesController {
  constructor(private readonly postulacionesService: PostulacionesService) {}

  /**
   * Envío del formulario de postulación pública (Pasos 1 a 4)
   */
  @Post()
  async create(@Body() createDto: CreatePostulacionDto) {
    const postulacion = await this.postulacionesService.create(createDto);
    return {
      message: 'Postulación registrada exitosamente',
      codigoPostulacion: postulacion.codigoPostulacion,
      postulacion,
    };
  }

  /**
   * Métricas resumidas y KPIs para la cabecera de P-06
   * Permitido para ADMIN_PASTORAL y CATOLIDER (Solo Lectura)
   */
  @Get('kpis')
  @Roles(RolUsuario.ADMIN_PASTORAL, RolUsuario.CATOLIDER)
  async getKpis() {
    return await this.postulacionesService.getKpis();
  }

  /**
   * Consulta filtrable y paginada de postulantes
   * Permitido para ADMIN_PASTORAL y CATOLIDER (Solo Lectura)
   */
  @Get()
  @Roles(RolUsuario.ADMIN_PASTORAL, RolUsuario.CATOLIDER)
  async findAll(@Query() filterDto: FilterPostulacionesDto) {
    return await this.postulacionesService.findAll(filterDto);
  }

  /**
   * Consulta pública por código de postulación (ej. para postulantes en seguimiento)
   */
  @Get('codigo/:codigo')
  async findByCodigo(@Param('codigo') codigo: string) {
    return await this.postulacionesService.findByCodigo(codigo);
  }

  /**
   * Consulta de ficha detallada para el Drawer de P-06
   */
  @Get(':id')
  @Roles(RolUsuario.ADMIN_PASTORAL, RolUsuario.CATOLIDER)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.postulacionesService.findOne(id);
  }

  /**
   * Cambio de estado de la postulación
   * Exclusivo de ADMIN_PASTORAL (Catolíderes no tienen permiso de mutación)
   */
  @Patch(':id/estado')
  @Roles(RolUsuario.ADMIN_PASTORAL)
  async updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateEstadoPostulacionDto,
  ) {
    const postulacion = await this.postulacionesService.updateEstado(id, updateDto);
    return {
      message: `Estado de la postulación actualizado a ${postulacion.estado}`,
      postulacion,
    };
  }
}
