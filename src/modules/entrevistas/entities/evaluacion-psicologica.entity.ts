import { Column, Entity, PrimaryGeneratedColumn, ValueTransformer } from 'typeorm';
import { DictamenPsicologico, PoblacionSugerida } from '../enums/entrevistas.enums';

export interface SubdimensionesEsre {
  socializacion: number;
  eficacia: number;
  proactividad: number;
  gestionPersonal: number;
}

/** PostgreSQL devuelve DECIMAL como string; lo exponemos como number. */
const decimalANumero: ValueTransformer = {
  to: (valor?: number | null) => valor,
  from: (valor?: string | null) => (valor === null || valor === undefined ? null : Number(valor)),
};

/**
 * Tabla `evaluaciones_psicologicas` de init.sql (P-09).
 * - psicologo_id: no existe rol psicólogo; guarda el id del usuario de
 *   Administración Pastoral que registra la evaluación ("Registrado por").
 * - observaciones_confidenciales: corresponde a observaciones_restringidas.
 * - poblaciones_sugeridas: arreglo de poblacion_sugerida_enum (migración M03).
 */
@Entity({ name: 'evaluaciones_psicologicas', synchronize: false })
export class EvaluacionPsicologicaEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'postulacion_id', unique: true })
  postulacionId: number;

  @Column({ type: 'int', name: 'psicologo_id', nullable: true })
  registradoPorId: number | null;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'puntaje_global_esre',
    nullable: true,
    transformer: decimalANumero,
  })
  puntajeGlobalEsre: number | null;

  @Column({ type: 'jsonb', name: 'subdimensiones_esre', nullable: true })
  subdimensionesEsre: SubdimensionesEsre | null;

  @Column({
    type: 'enum',
    enum: DictamenPsicologico,
    enumName: 'dictamen_psicologico_enum',
  })
  dictamen: DictamenPsicologico;

  @Column({
    type: 'enum',
    enum: PoblacionSugerida,
    enumName: 'poblacion_sugerida_enum',
    array: true,
    name: 'poblaciones_sugeridas',
  })
  poblacionesSugeridas: PoblacionSugerida[];

  @Column({ type: 'text', name: 'observaciones_confidenciales', nullable: true })
  observacionesConfidenciales: string | null;

  @Column({ type: 'varchar', length: 1000, name: 'informe_pdf_url' })
  informePdfUrl: string;
}
