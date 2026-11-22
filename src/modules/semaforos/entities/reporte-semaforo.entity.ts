import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AsignacionUbicacionEntity } from '../../ubicacion/entities/asignacion-ubicacion.entity';

@Entity('reportes_semaforo')
export class ReporteSemaforoEntity extends BaseEntity {
  @Column({ type: 'int', name: 'id_asignacion' })
  idAsignacion: number;

  @ManyToOne(() => AsignacionUbicacionEntity, (asignacion) => asignacion.semaforos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_asignacion' })
  asignacion: AsignacionUbicacionEntity;

  @Column({ type: 'varchar', length: 50 })
  mes: string;

  @Column({ type: 'int', default: 2026 })
  anio: number;

  @Column({ type: 'varchar', length: 20, name: 'color_semaforo' })
  colorSemaforo: string; // 'Verde' | 'Amarillo' | 'Rojo' | 'Morado'

  @Column({ type: 'text', name: 'observaciones_desempeno', nullable: true })
  observacionesDesempeno?: string;

  @Column({ type: 'boolean', name: 'notificar_abandono', default: false })
  notificarAbandono: boolean;

  @Column({ type: 'int', name: 'catolider_evaluador_id', nullable: true })
  catoliderEvaluadorId?: number;
}
