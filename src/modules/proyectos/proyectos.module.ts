import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProyectoReceptorEntity } from './entities/proyecto-receptor.entity';
import { InstitucionEntity } from './entities/institucion.entity';
import { AsignacionUbicacionEntity } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { ProyectosService } from './proyectos.service';
import { ProyectosController } from './proyectos.controller';
import { InstitucionesService } from './instituciones.service';
import { InstitucionesController } from './instituciones.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InstitucionEntity,
      ProyectoReceptorEntity,
      AsignacionUbicacionEntity,
    ]),
  ],
  controllers: [ProyectosController, InstitucionesController],
  providers: [ProyectosService, InstitucionesService],
  exports: [ProyectosService, InstitucionesService, TypeOrmModule],
})
export class ProyectosModule {}
