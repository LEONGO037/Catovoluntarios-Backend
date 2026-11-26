import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SemaforosController } from './semaforos.controller';
import { SemaforosService } from './semaforos.service';
import { ReporteSemaforoEntity } from './entities/reporte-semaforo.entity';
import { PremioHistoricoEntity } from './entities/premio-historico.entity';
import { EvaluacionProyectoEntity } from './entities/evaluacion-proyecto.entity';
import { CertificadoFundacionEntity } from './entities/certificado-fundacion.entity';
import { UserEntity } from '../users/entities/user.entity';
import { AsignacionUbicacionEntity } from '../ubicacion/entities/asignacion-ubicacion.entity';
import { ProyectoReceptorEntity } from '../proyectos/entities/proyecto-receptor.entity';
import { StorageModule } from '../storage/storage.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReporteSemaforoEntity,
      PremioHistoricoEntity,
      EvaluacionProyectoEntity,
      CertificadoFundacionEntity,
      UserEntity,
      AsignacionUbicacionEntity,
      ProyectoReceptorEntity,
    ]),
    StorageModule,
    NotificacionesModule,
  ],
  controllers: [SemaforosController],
  providers: [SemaforosService],
  exports: [SemaforosService],
})
export class SemaforosModule {}
