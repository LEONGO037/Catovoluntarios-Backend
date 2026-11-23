import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProyectoReceptorEntity } from '../../proyectos/entities/proyecto-receptor.entity';

/**
 * Cierre mensual de un proyecto receptor (P-16): Pastoral cruza las asistencias aprobadas por el
 * Catolíder con la planilla física firmada por el supervisor del centro. Una vez conciliado,
 * el mes queda bloqueado para ese proyecto (RNF-06).
 */
@Entity('conciliaciones_mensuales_supervisor')
export class ConciliacionMensualEntity extends BaseEntity {
  @Column({ type: 'int', name: 'proyecto_id' })
  proyectoId: number;

  @ManyToOne(() => ProyectoReceptorEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto?: ProyectoReceptorEntity;

  @Column({ type: 'varchar', length: 20, default: '2/2026' })
  semestre: string;

  @Column({ type: 'int' })
  mes: number;

  @Column({ type: 'int' })
  anio: number;

  @Column({ type: 'varchar', length: 1000, name: 'reporte_firmas_supervisor_url', nullable: true })
  reporteFirmasSupervisorUrl?: string | null;

  @Column({ type: 'int', name: 'total_voluntarios_reportados', default: 0 })
  totalVoluntariosReportados: number;

  @Column({ type: 'int', name: 'total_dias_asistidos', default: 0 })
  totalDiasAsistidos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'monto_total_pasajes', default: 0 })
  montoTotalPasajes: number;

  @Column({ type: 'text', nullable: true })
  observaciones?: string | null;

  @Column({ type: 'int', name: 'conciliado_por', nullable: true })
  conciliadoPor?: number | null;

  @Column({ type: 'timestamp with time zone', name: 'fecha_conciliacion', default: () => 'now()' })
  fechaConciliacion: Date;
}
