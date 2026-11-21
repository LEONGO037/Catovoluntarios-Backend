import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProyectoReceptorEntity } from './entities/proyecto-receptor.entity';
import { AsignacionUbicacionEntity } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { ProyectosService } from './proyectos.service';
import { ProyectosController } from './proyectos.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProyectoReceptorEntity,
      AsignacionUbicacionEntity,
    ]),
  ],
  controllers: [ProyectosController],
  providers: [ProyectosService],
  exports: [ProyectosService, TypeOrmModule],
})
export class ProyectosModule {}
