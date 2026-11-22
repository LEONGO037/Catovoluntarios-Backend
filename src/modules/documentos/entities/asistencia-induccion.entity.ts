import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { SesionInduccionEntity } from './sesion-induccion.entity';

export enum EstadoInduccion {
  COMPLETADA = 'COMPLETADA',
  EN_PROCESO = 'EN_PROCESO',
  PENDIENTE = 'PENDIENTE',
  REPROGRAMAR = 'REPROGRAMAR',
}

@Entity('asistencias_induccion')
export class AsistenciaInduccionEntity extends BaseEntity {
  @Column({ type: 'int', name: 'sesion_induccion_id' })
  sesionInduccionId: number;

  @ManyToOne(() => SesionInduccionEntity, (sesion) => sesion.asistencias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sesion_induccion_id' })
  sesion: SesionInduccionEntity;

  @Column({ type: 'int', name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  usuario: UserEntity;

  @Column({ type: 'boolean', default: false })
  asistio: boolean;

  @Column({ type: 'date', name: 'fecha_charla', nullable: true })
  fechaCharla?: string;

  @Column({ type: 'varchar', length: 100, name: 'recorrido_sitio', nullable: true })
  recorridoSitio?: string;

  @Column({
    type: 'enum',
    enum: EstadoInduccion,
    name: 'estado_induccion',
    default: EstadoInduccion.PENDIENTE,
  })
  estadoInduccion: EstadoInduccion;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;
}
