import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AsignacionUbicacionEntity } from '../../ubicacion/entities/asignacion-ubicacion.entity';

@Entity('registros_asistencia')
export class RegistroAsistenciaEntity extends BaseEntity {
  @Column({ type: 'int', name: 'id_asignacion' })
  idAsignacion: number;

  @ManyToOne(() => AsignacionUbicacionEntity, (asignacion) => asignacion.asistencias, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_asignacion' })
  asignacion: AsignacionUbicacionEntity;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'time', name: 'hora_ingreso' })
  horaIngreso: string;

  @Column({ type: 'time', name: 'hora_salida' })
  horaSalida: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'horas_calculadas',
    default: 4.0,
  })
  horasCalculadas: number;

  @Column({ type: 'text', name: 'tareas_realizadas', nullable: true })
  tareasRealizadas?: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'estado_aprobacion',
    default: 'Registrado',
  })
  estadoAprobacion: string; // 'Registrado' | 'Aprobado_Catolider' | 'Conciliado'

  @Column({ type: 'boolean', name: 'es_actividad_emergente', default: false })
  esActividadEmergente: boolean;

  @Column({ type: 'int', name: 'aprobado_por_catolider_id', nullable: true })
  aprobadoPorCatoliderId?: number;

  @Column({ type: 'text', name: 'observaciones_aprobacion', nullable: true })
  observacionesAprobacion?: string;
}
