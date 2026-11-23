import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MotivoTraslado {
  CRUCE_MATERIAS = 'CRUCE_MATERIAS_UNIVERSITARIAS',
  DIFICULTAD_TRANSPORTE = 'DIFICULTAD_TRANSPORTE_DISTANCIA',
  SOLICITUD_SUPERVISOR = 'SOLICITUD_SUPERVISOR_CENTRO',
  INCOMPATIBILIDAD_PERFIL = 'INCOMPATIBILIDAD_PERFIL',
  OTRO_JUSTIFICADO = 'OTRO_JUSTIFICADO',
}

@Entity('historial_reasignaciones')
export class HistorialReasignacionEntity {
  @PrimaryGeneratedColumn({ name: 'id_historial' })
  id_historial: number;

  @Column({ type: 'int' })
  id_asignacion: number;

  @Column({ type: 'int' })
  id_usuario: number;

  @Column({ type: 'int' })
  id_proyecto_origen: number;

  @Column({ type: 'int' })
  id_proyecto_destino: number;

  @Column({
    type: 'enum',
    enum: MotivoTraslado,
    enumName: 'motivo_traslado_enum',
  })
  motivo_traslado: MotivoTraslado;

  @Column({ type: 'timestamp with time zone' })
  fecha_efectiva: Date;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @Column({ type: 'int', nullable: true })
  registrado_por_id: number | null;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;
}
