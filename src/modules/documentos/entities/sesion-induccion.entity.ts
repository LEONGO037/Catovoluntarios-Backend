import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ProyectoReceptorEntity } from '../../proyectos/entities/proyecto-receptor.entity';
import { AsistenciaInduccionEntity } from './asistencia-induccion.entity';

@Entity('sesiones_induccion')
export class SesionInduccionEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 20, default: '2/2026' })
  semestre: string;

  @Column({ type: 'varchar', length: 150 })
  titulo: string;

  @Column({ type: 'timestamp with time zone', name: 'fecha_hora' })
  fechaHora: Date;

  @Column({ type: 'varchar', length: 50, default: 'PRESENCIAL' })
  modalidad: string;

  @Column({ type: 'text', name: 'lugar_enlace', nullable: true })
  lugarEnlace?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  facilitador?: string;

  @Column({ type: 'int', name: 'proyecto_id', nullable: true })
  proyectoId?: number;

  @ManyToOne(() => ProyectoReceptorEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto?: ProyectoReceptorEntity;

  @OneToMany(() => AsistenciaInduccionEntity, (asistencia) => asistencia.sesion)
  asistencias: AsistenciaInduccionEntity[];
}
