/**
 * ⚠ TEMPORAL (M03) — Todo lo de esta carpeta se reemplaza al integrar con
 * M01 (usuarios), M02 (postulaciones), M05 (proyectos receptores) y R2.
 */
import { Module } from '@nestjs/common';
import { LecturasExternasService } from './lecturas-externas.service';
import { AlmacenamientoLocalService } from './almacenamiento-local.service';
import { SimuladosM03Controller } from './simulados-m03.controller';

@Module({
  controllers: [SimuladosM03Controller],
  providers: [LecturasExternasService, AlmacenamientoLocalService],
  exports: [LecturasExternasService, AlmacenamientoLocalService],
})
export class SimuladosM03Module {}
