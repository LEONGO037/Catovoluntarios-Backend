import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MotivoTraslado {
  CRUCE_MATERIAS = 'Cruce con materias universitarias',
  DIFICULTAD_TRANSPORTE = 'Dificultad de transporte/distancia',
  SOLICITUD_SUPERVISOR = 'Solicitud de supervisor del centro',
  INCOMPATIBILIDAD_PERFIL = 'Incompatibilidad de perfil',
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
