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
import { InstitucionesService } from './instituciones.service';
import { CreateInstitucionDto } from './dto/create-institucion.dto';
import { UpdateInstitucionDto } from './dto/update-institucion.dto';
import { FilterInstitucionDto } from './dto/filter-institucion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('instituciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstitucionesController {
  constructor(private readonly institucionesService: InstitucionesService) {}

  @Post()
  @Roles(Role.ADMIN_PASTORAL)
  create(@Body() createDto: CreateInstitucionDto) {
    return this.institucionesService.create(createDto);
  }

  @Get()
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER, Role.ENCARGADO_RECEPTOR)
  findAll(@Query() filter: FilterInstitucionDto) {
    return this.institucionesService.findAll(filter);
  }

  @Get(':id')
  @Roles(Role.ADMIN_PASTORAL, Role.CATOLIDER, Role.ENCARGADO_RECEPTOR)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.institucionesService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN_PASTORAL)
  updatePut(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateInstitucionDto,
  ) {
    return this.institucionesService.update(id, updateDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN_PASTORAL)
  updatePatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateInstitucionDto,
  ) {
    return this.institucionesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN_PASTORAL)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.institucionesService.remove(id);
  }
}
