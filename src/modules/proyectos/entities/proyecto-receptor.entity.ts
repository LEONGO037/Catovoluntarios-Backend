import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AsignacionUbicacionEntity } from '../../ubicacion/entities/asignacion-ubicacion.entity';

@Entity('proyectos_receptores')
export class ProyectoReceptorEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 200, name: 'nombre_proyecto' })
  nombreProyecto: string;

  get nombre_proyecto(): string {
    return this.nombreProyecto;
  }
  set nombre_proyecto(val: string) {
    this.nombreProyecto = val;
  }

  @Column({ type: 'varchar', length: 50 })
  zona: string;

  @Column({ type: 'varchar', length: 250, default: '' })
  direccion: string;

  @Column({ type: 'varchar', length: 150, name: 'contacto_nombre', nullable: true })
  contactoNombre?: string;

  get contacto_nombre(): string | undefined {
    return this.contactoNombre;
  }
  set contacto_nombre(val: string | undefined) {
    this.contactoNombre = val;
  }

  @Column({ type: 'varchar', length: 30, name: 'contacto_telefono', nullable: true })
  contactoTelefono?: string;

  get contacto_telefono(): string | undefined {
    return this.contactoTelefono;
  }
  set contacto_telefono(val: string | undefined) {
    this.contactoTelefono = val;
  }

  @Column({ type: 'varchar', length: 150, name: 'contacto_email', nullable: true })
  contactoEmail?: string;

  get contacto_email(): string | undefined {
    return this.contactoEmail;
  }
  set contacto_email(val: string | undefined) {
    this.contactoEmail = val;
  }

  @Column({ type: 'int', name: 'cupos_totales', default: 15 })
  cuposTotales: number;

  get cupos_totales(): number {
    return this.cuposTotales;
  }
  set cupos_totales(val: number) {
    this.cuposTotales = val;
  }

  @Column({ type: 'int', name: 'cupos_disponibles', default: 15 })
  cuposDisponibles: number;

  get cupos_disponibles(): number {
    return this.cuposDisponibles;
  }
  set cupos_disponibles(val: number) {
    this.cuposDisponibles = val;
  }

  @Column({ type: 'jsonb', name: 'areas_requeridas', nullable: true })
  areasRequeridas?: Record<string, number>;

  get areas_requeridas(): Record<string, number> | undefined {
    return this.areasRequeridas;
  }
  set areas_requeridas(val: Record<string, number> | undefined) {
    this.areasRequeridas = val;
  }

  @Column({ type: 'date', name: 'vigencia_convenio_inicio', nullable: true })
  vigenciaConvenioInicio?: Date;

  get vigencia_convenio_inicio(): Date | undefined {
    return this.vigenciaConvenioInicio;
  }
  set vigencia_convenio_inicio(val: Date | undefined) {
    this.vigenciaConvenioInicio = val;
  }

  @Column({ type: 'date', name: 'vigencia_convenio_fin', nullable: true })
  vigenciaConvenioFin?: Date;

  get vigencia_convenio_fin(): Date | undefined {
    return this.vigenciaConvenioFin;
  }
  set vigencia_convenio_fin(val: Date | undefined) {
    this.vigenciaConvenioFin = val;
  }

  @Column({ type: 'int', nullable: true, name: 'catolider_titular_id' })
  catolider_titular_id?: number | null;

  @Column({ type: 'int', nullable: true, name: 'catolider_aprendiz_id' })
  catolider_aprendiz_id?: number | null;

  @Column({ type: 'int', nullable: true, name: 'supervisor_centro_id' })
  supervisorCentroId?: number | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @OneToMany(() => AsignacionUbicacionEntity, (asignacion) => asignacion.proyecto)
  asignaciones: AsignacionUbicacionEntity[];
}
