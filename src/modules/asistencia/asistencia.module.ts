import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module';
import { ProyectoReceptorEntity } from '../proyectos/entities/proyecto-receptor.entity';
import { AsignacionUbicacionEntity } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { UserEntity } from '../users/entities/user.entity';
import { DocumentoVoluntarioEntity } from '../documentos/entities/documento-voluntario.entity';
import { RegistroAsistenciaEntity } from './entities/registro-asistencia.entity';
import { ActividadEmergenteEntity } from './entities/actividad-emergente.entity';
import { ConciliacionMensualEntity } from './entities/conciliacion-mensual.entity';
import { LiquidacionPasajeEntity } from './entities/liquidacion-pasaje.entity';
import { AsistenciaService } from './asistencia.service';
import { PasajesService } from './pasajes.service';
import { PortalVoluntarioService } from './portal-voluntario.service';
import {
  AsistenciaController,
  PasajesController,
  PortalVoluntarioController,
} from './asistencia.controller';

/** M06 — Asistencia, Planillas de Pasajes y Portal del Catovoluntario (P-16, P-17, P-18). */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegistroAsistenciaEntity,
      ActividadEmergenteEntity,
      ConciliacionMensualEntity,
      LiquidacionPasajeEntity,
      AsignacionUbicacionEntity,
      ProyectoReceptorEntity,
      UserEntity,
      DocumentoVoluntarioEntity,
    ]),
    StorageModule,
  ],
  controllers: [AsistenciaController, PasajesController, PortalVoluntarioController],
  providers: [AsistenciaService, PasajesService, PortalVoluntarioService],
  exports: [AsistenciaService],
})
export class AsistenciaModule {}
