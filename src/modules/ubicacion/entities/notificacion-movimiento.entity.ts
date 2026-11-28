import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TipoNotificacionMovimiento {
  ALTA_UBICACION = 'ALTA_UBICACION',
  BAJA_UBICACION = 'BAJA_UBICACION',
  BAJA_CATOLIDER = 'BAJA_CATOLIDER',
  ALTA_CATOLIDER = 'ALTA_CATOLIDER',
  REASIGNACION_VOLUNTARIO = 'REASIGNACION_VOLUNTARIO',
}

@Entity('notificaciones_movimiento')
export class NotificacionMovimientoEntity {
  @PrimaryGeneratedColumn({ name: 'id_notificacion' })
  id_notificacion: number;

  @Column({ type: 'int' })
  id_usuario_destinatario: number;

  @Column({ type: 'varchar', length: 50 })
  rol_destinatario: string;

  @Column({
    type: 'enum',
    enum: TipoNotificacionMovimiento,
  })
  tipo_notificacion: TipoNotificacionMovimiento;

  @Column({ type: 'int', nullable: true })
  id_asignacion: number | null;

  @Column({ type: 'int', nullable: true })
  id_proyecto: number | null;

  @Column({ type: 'varchar', length: 20, name: 'semestre', default: '2/2026' })
  semestre: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'motivo_traslado',
    nullable: true,
  })
  motivo_traslado: string | null;

  @Column({ type: 'text', name: 'motivo_otro_detalle', nullable: true })
  motivo_otro_detalle: string | null;

  @Column({ type: 'varchar', length: 200 })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ type: 'boolean', default: false })
  leido: boolean;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_envio: Date;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;
}
