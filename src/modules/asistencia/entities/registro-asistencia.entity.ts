import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AsignacionUbicacionEntity } from '../../ubicacion/entities/asignacion-ubicacion.entity';
import { ActividadEmergenteEntity } from './actividad-emergente.entity';

/** Estados del flujo de asistencia (P-16): voluntario registra → Catolíder aprueba → Pastoral concilia. */
export enum EstadoAsistencia {
  REGISTRADO = 'REGISTRADO',
  APROBADO_CATOLIDER = 'APROBADO_CATOLIDER',
  OBSERVADO_CATOLIDER = 'OBSERVADO_CATOLIDER',
  CONCILIADO_PASTORAL = 'CONCILIADO_PASTORAL',
}

/** Presencial: jornada en el centro (genera pasaje). No presencial: taller/reunión (no genera).
 *  Emergente: actividad extraordinaria de Pastoral (genera pasaje solo si Pastoral lo habilita). */
export enum TipoActividadAsistencia {
  PRESENCIAL = 'PRESENCIAL',
  NO_PRESENCIAL = 'NO_PRESENCIAL',
  EMERGENTE = 'EMERGENTE',
}

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
  fecha: string;

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
    type: 'enum',
    enum: EstadoAsistencia,
    enumName: 'estado_asistencia_enum',
    name: 'estado_aprobacion',
    default: EstadoAsistencia.REGISTRADO,
  })
  estadoAprobacion: EstadoAsistencia;

  @Column({ type: 'varchar', length: 20, name: 'tipo_actividad', default: TipoActividadAsistencia.PRESENCIAL })
  tipoActividad: TipoActividadAsistencia;

  @Column({ type: 'boolean', name: 'genera_pasaje', default: true })
  generaPasaje: boolean;

  @Column({ type: 'int', name: 'id_actividad_emergente', nullable: true })
  idActividadEmergente?: number | null;

  @ManyToOne(() => ActividadEmergenteEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_actividad_emergente' })
  actividadEmergente?: ActividadEmergenteEntity | null;

  @Column({ type: 'boolean', name: 'conciliado_en_planilla', default: false })
  conciliadoEnPlanilla: boolean;

  @Column({ type: 'int', name: 'registrado_por_id', nullable: true })
  registradoPorId?: number | null;

  @Column({ type: 'int', name: 'aprobado_por_catolider_id', nullable: true })
  aprobadoPorCatoliderId?: number | null;

  @Column({ type: 'timestamp with time zone', name: 'fecha_aprobacion', nullable: true })
  fechaAprobacion?: Date | null;

  @Column({ type: 'text', name: 'observaciones_aprobacion', nullable: true })
  observacionesAprobacion?: string | null;
}
