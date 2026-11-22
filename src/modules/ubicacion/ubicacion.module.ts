import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsignacionUbicacionEntity } from './entities/asignacion-ubicacion.entity';
import { HistorialReasignacionEntity } from './entities/historial-reasignacion.entity';
import { NotificacionMovimientoEntity } from './entities/notificacion-movimiento.entity';
import { ProyectoReceptorEntity } from '../proyectos/entities/proyecto-receptor.entity';
import { UbicacionService } from './ubicacion.service';
import { UbicacionController } from './ubicacion.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AsignacionUbicacionEntity,
      HistorialReasignacionEntity,
      NotificacionMovimientoEntity,
      ProyectoReceptorEntity,
    ]),
  ],
  controllers: [UbicacionController],
  providers: [UbicacionService],
  exports: [UbicacionService, TypeOrmModule],
})
export class UbicacionModule {}
