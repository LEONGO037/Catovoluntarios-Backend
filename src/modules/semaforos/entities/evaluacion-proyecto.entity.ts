import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProyectoReceptorEntity } from '../../proyectos/entities/proyecto-receptor.entity';

@Entity('evaluaciones_proyectos_receptores')
export class EvaluacionProyectoEntity extends BaseEntity {
  @Column({ type: 'int', name: 'proyecto_id' })
  proyectoId: number;

  @ManyToOne(() => ProyectoReceptorEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto: ProyectoReceptorEntity;

  @Column({ type: 'varchar', length: 20, default: '2/2026' })
  semestre: string;

  @Column({ type: 'int', name: 'voluntarios_recibidos', default: 0 })
  voluntariosRecibidos: number;

  @Column({ type: 'int', name: 'voluntarios_culminados', default: 0 })
  voluntariosCulminados: number;

  @Column({ type: 'int', name: 'calificacion_grupo', default: 5 })
  calificacionGrupo: number; // 1 a 5

  @Column({ type: 'int', name: 'calificacion_catolider', default: 5 })
  calificacionCatolider: number; // 1 a 5

  @Column({ type: 'boolean', name: 'solicita_continuidad_convenio', default: true })
  solicitaContinuidadConvenio: boolean;

  @Column({ type: 'int', name: 'cupos_solicitados_proximo_semestre', default: 20 })
  cuposSolicitadosProximoSemestre: number;

  @Column({ type: 'text', name: 'bloque4_observaciones_sugerencias_libres' })
  bloque4ObservacionesSugerenciasLibres: string;

  @Column({ type: 'varchar', length: 150, name: 'nombre_responsable_llenado' })
  nombreResponsableLlenado: string;

  @Column({ type: 'varchar', length: 100, name: 'cargo_responsable', nullable: true })
  cargoResponsable?: string;

  @Column({ type: 'varchar', length: 1000, name: 'documento_respaldo_url', nullable: true })
  documentoRespaldoUrl?: string;

  @Column({ type: 'date', name: 'fecha_evaluacion', default: () => 'CURRENT_DATE' })
  fechaEvaluacion: Date;
}
