import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ProyectoReceptorEntity } from '../proyectos/entities/proyecto-receptor.entity';
import { PostulacionEntity } from '../postulaciones/entities/postulacion.entity';
import { AsignacionUbicacionEntity } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { RegistroAsistenciaEntity } from '../asistencia/entities/registro-asistencia.entity';
import { ReporteSemaforoEntity } from '../semaforos/entities/reporte-semaforo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProyectoReceptorEntity,
      PostulacionEntity,
      AsignacionUbicacionEntity,
      RegistroAsistenciaEntity,
      ReporteSemaforoEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
