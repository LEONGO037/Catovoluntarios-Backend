import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notificaciones_sistema')
@Index('idx_notificaciones_usuario_gestion', ['userId', 'semestre', 'id'])
export class NotificacionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int', select: false })
  userId: number;

  @Column({ type: 'varchar', length: 150 })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ type: 'varchar', length: 50, default: 'INFO' })
  tipo: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  semestre: string | null;

  @Column({ type: 'boolean', default: false })
  leida: boolean;

  @Column({ name: 'enlace_destino', type: 'varchar', length: 255, nullable: true })
  enlaceDestino: string | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', select: false })
  updatedAt: Date;
}
