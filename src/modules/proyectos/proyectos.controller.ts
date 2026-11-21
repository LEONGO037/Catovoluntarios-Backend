import {
  Controller,
  Get,
  Post,
  Put,
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('proyectos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProyectosController {
  constructor(private readonly proyectosService: ProyectosService) {}

  @Post()
  @Roles('ADMIN_PASTORAL')
  create(@Body() createDto: CreateProyectoReceptorDto) {
    return this.proyectosService.create(createDto);
  }

  @Get()
  @Roles('ADMIN_PASTORAL', 'CATOLIDER')
  findAll(@Query() filter: FilterProyectoDto) {
    return this.proyectosService.findAll(filter);
  }

  @Get(':id')
  @Roles('ADMIN_PASTORAL', 'CATOLIDER')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.proyectosService.findOne(id);
  }

  @Put(':id')
  @Roles('ADMIN_PASTORAL')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProyectoReceptorDto,
  ) {
    return this.proyectosService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMIN_PASTORAL')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.proyectosService.remove(id);
  }
}
