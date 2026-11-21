import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AsignacionUbicacionEntity } from '../../ubicacion/entities/asignacion-ubicacion.entity';

@Entity('proyectos_receptores')
export class ProyectoReceptorEntity {
  @PrimaryGeneratedColumn({ name: 'id_proyecto' })
  id_proyecto: number;

  @Column({ type: 'varchar', length: 150 })
  nombre_proyecto: string;

  @Column({ type: 'varchar', length: 255 })
  direccion_exacta: string;

  @Column({ type: 'varchar', length: 100 })
  macrodistrito_zona: string;

  @Column({ type: 'varchar', length: 150 })
  nombre_supervisor_centro: string;

  @Column({ type: 'varchar', length: 30 })
  telefono_contacto: string;

  @Column({ type: 'varchar', length: 120 })
  correo: string;

  @Column({ type: 'date' })
  fecha_inicio_convenio: string;

  @Column({ type: 'date' })
  fecha_fin_convenio: string;

  @Column({ type: 'text' })
  poblacion_objetivo: string;

  @Column({ type: 'text' })
  actividades_semestre_actual: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  monto_pasaje_fijo: number;

  @Column({ type: 'int', default: 0 })
  cupo_maximo_voluntarios: number;

  @Column({ type: 'int', nullable: true })
  catolider_titular_id: number | null;

  @Column({ type: 'int', nullable: true })
  catolider_aprendiz_id: number | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @OneToMany(
    () => AsignacionUbicacionEntity,
    (asignacion) => asignacion.proyecto,
  )
  asignaciones: AsignacionUbicacionEntity[];

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;
}
