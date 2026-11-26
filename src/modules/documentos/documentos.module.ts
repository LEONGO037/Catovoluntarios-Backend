import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentosController } from './documentos.controller';
import { DocumentosService } from './documentos.service';
import { DocumentoVoluntarioEntity } from './entities/documento-voluntario.entity';
import { SesionInduccionEntity } from './entities/sesion-induccion.entity';
import { AsistenciaInduccionEntity } from './entities/asistencia-induccion.entity';
import { AsignacionUbicacionEntity } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { UserEntity } from '../users/entities/user.entity';
import { StorageModule } from '../storage/storage.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentoVoluntarioEntity,
      SesionInduccionEntity,
      AsistenciaInduccionEntity,
      AsignacionUbicacionEntity,
      UserEntity,
    ]),
    StorageModule,
    NotificacionesModule,
  ],
  controllers: [DocumentosController],
  providers: [DocumentosService],
  exports: [DocumentosService],
})
export class DocumentosModule {}
