import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ProyectosService } from './proyectos.service';
import { CreateProyectoReceptorDto } from './dto/create-proyecto-receptor.dto';
import { UpdateProyectoReceptorDto } from './dto/update-proyecto-receptor.dto';
import { FilterProyectoDto } from './dto/filter-proyecto.dto';
import { ReactivarProyectoDto } from './dto/reactivar-proyecto.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('proyectos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  @Post()
  @Roles(Role.ADMIN_PASTORAL)
  create(@Body() createDto: CreateProyectoReceptorDto) {
    return this.proyectosService.create(createDto);
  }

  @Get()
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER, Role.ENCARGADO_RECEPTOR)
  findAll(@Query() filter: FilterProyectoDto) {
    return this.proyectosService.findAll(filter);
  }

  @Get('reutilizables')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER)
  findReutilizables(
    @Query('semestre') semestre?: string,
    @Query('gestion') gestion?: string,
  ) {
    return this.proyectosService.findReutilizables(semestre, gestion);
  }

  @Get(':id')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER, Role.ENCARGADO_RECEPTOR)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.proyectosService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN_PASTORAL)
  updatePut(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProyectoReceptorDto,
  ) {
    return this.proyectosService.update(id, updateDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN_PASTORAL)
  updatePatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProyectoReceptorDto,
  ) {
    return this.proyectosService.update(id, updateDto);
  }

  @Post(':id/reactivar')
  @Roles(Role.ADMIN_PASTORAL)
  reactivarPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReactivarProyectoDto,
  ) {
    return this.proyectosService.reactivar(id, dto);
  }

  @Patch(':id/reactivar')
  @Roles(Role.ADMIN_PASTORAL)
  reactivarPatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReactivarProyectoDto,
  ) {
    return this.proyectosService.reactivar(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN_PASTORAL)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.proyectosService.remove(id);
  }
}
