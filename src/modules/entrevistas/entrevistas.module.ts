import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntrevistaEntity } from './entities/entrevista.entity';
import { EvaluacionPsicologicaEntity } from './entities/evaluacion-psicologica.entity';
import { EntrevistasController } from './entrevistas.controller';
import { EntrevistasService } from './entrevistas.service';
import { PsicologiaController } from './psicologia.controller';
import { PsicologiaService } from './psicologia.service';
import { SimuladosM03Module } from '../../simulados-m03/simulados-m03.module';

/** M03 — Entrevistas (P-07, P-08) y Evaluación Psicológica E-SRE (P-09). */
@Module({
  imports: [
    TypeOrmModule.forFeature([EntrevistaEntity, EvaluacionPsicologicaEntity]),
    SimuladosM03Module,
  ],
  controllers: [EntrevistasController, PsicologiaController],
  providers: [EntrevistasService, PsicologiaService],
  exports: [EntrevistasService, PsicologiaService],
})
export class EntrevistasModule {}
