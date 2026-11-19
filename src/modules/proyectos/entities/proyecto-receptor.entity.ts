import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AsignacionUbicacionEntity } from '../../ubicacion/entities/asignacion-ubicacion.entity';

@Entity('proyectos_receptores')
export class ProyectoReceptorEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 200, name: 'nombre_proyecto' })
  nombreProyecto: string;

  @Column({ type: 'varchar', length: 255, name: 'direccion_exacta' })
  direccionExacta: string;

  @Column({ type: 'varchar', length: 100, name: 'macrodistrito_zona', nullable: true })
  macrodistritoZona?: string;

  @Column({ type: 'varchar', length: 150, name: 'supervisor_nombre', nullable: true })
  supervisorNombre?: string;

  @Column({ type: 'varchar', length: 20, name: 'supervisor_telefono', nullable: true })
  supervisorTelefono?: string;

  @Column({ type: 'varchar', length: 150, name: 'supervisor_email', nullable: true })
  supervisorEmail?: string;

  @Column({ type: 'date', name: 'fecha_inicio_convenio', nullable: true })
  fechaInicioConvenio?: Date;

  @Column({ type: 'date', name: 'fecha_fin_convenio', nullable: true })
  fechaFinConvenio?: Date;

  @Column({ type: 'text', name: 'poblacion_objetivo' })
  poblacionObjetivo: string;

  @Column({ type: 'text', name: 'actividades_semestre_actual' })
  actividadesSemestreActual: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'monto_pasaje_por_dia',
    default: 10.0,
  })
  montoPasajePorDia: number;

  @Column({ type: 'int', name: 'cupo_maximo', default: 20 })
  cupoMaximo: number;

  @Column({ type: 'int', name: 'cupo_ocupado', default: 0 })
  cupoOcupado: number;

  @Column({ type: 'int', name: 'catolider_titular_id', nullable: true })
  catoliderTitularId?: number;

  @Column({ type: 'int', name: 'catolider_aprendiz_id', nullable: true })
  catoliderAprendizId?: number;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @OneToMany(() => AsignacionUbicacionEntity, (asignacion) => asignacion.proyecto)
  asignaciones: AsignacionUbicacionEntity[];
}
