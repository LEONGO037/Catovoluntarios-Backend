import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProyectoReceptorEntity } from '../../proyectos/entities/proyecto-receptor.entity';

export enum CondicionVoluntario {
  NUEVO = 'Nuevo',
  ANTIGUO = 'Antiguo',
}

export enum EstadoAsignacion {
  ACTIVO = 'Activo',
  REASIGNADO = 'Reasignado',
  RETIRADO = 'Retirado',
}

@Entity('asignaciones_ubicacion')
export class AsignacionUbicacionEntity {
  @PrimaryGeneratedColumn({ name: 'id_asignacion' })
  id_asignacion: number;

  @Column({ type: 'int' })
  id_usuario: number;

  @Column({ type: 'int' })
  id_proyecto: number;

  @Column({ type: 'varchar', length: 20 })
  semestre: string;

  @Column({
    type: 'enum',
    enum: CondicionVoluntario,
    default: CondicionVoluntario.NUEVO,
  })
  condicion: CondicionVoluntario;

  @Column({ type: 'varchar', length: 150 })
  horario_comprometido: string;

  @Column({ type: 'boolean', default: false })
  poliza_validada: boolean;

  @Column({ type: 'boolean', default: false })
  induccion_completada: boolean;

  @Column({ type: 'boolean', default: false })
  habilitado_campo: boolean;

  @Column({
    type: 'enum',
    enum: EstadoAsignacion,
    default: EstadoAsignacion.ACTIVO,
  })
  estado: EstadoAsignacion;

  @ManyToOne(
    () => ProyectoReceptorEntity,
    (proyecto) => proyecto.asignaciones,
    { onDelete: 'RESTRICT' },
  )
  @JoinColumn({ name: 'id_proyecto' })
  proyecto: ProyectoReceptorEntity;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;
}
