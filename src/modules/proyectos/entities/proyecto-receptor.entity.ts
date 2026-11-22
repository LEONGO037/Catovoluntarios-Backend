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
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  get id_proyecto(): number {
    return this.id;
  }
  set id_proyecto(val: number) {
    this.id = val;
  }

  @Column({ type: 'varchar', length: 200, name: 'nombre_proyecto' })
  nombreProyecto: string;

  get nombre_proyecto(): string {
    return this.nombreProyecto;
  }
  set nombre_proyecto(val: string) {
    this.nombreProyecto = val;
  }

  @Column({ type: 'varchar', length: 255, name: 'direccion_exacta', default: '' })
  direccionExacta: string;

  get direccion_exacta(): string {
    return this.direccionExacta;
  }
  set direccion_exacta(val: string) {
    this.direccionExacta = val;
  }

  get direccion(): string {
    return this.direccionExacta;
  }
  set direccion(val: string) {
    this.direccionExacta = val;
  }

  @Column({ type: 'varchar', length: 100, name: 'macrodistrito_zona', default: 'Centro' })
  macrodistritoZona: string;

  get macrodistrito_zona(): string {
    return this.macrodistritoZona;
  }
  set macrodistrito_zona(val: string) {
    this.macrodistritoZona = val;
  }

  get zona(): string {
    return this.macrodistritoZona;
  }
  set zona(val: string) {
    this.macrodistritoZona = val;
  }

  @Column({ type: 'int', nullable: true, name: 'usuario_supervisor_id' })
  usuarioSupervisorId?: number | null;

  @Column({ type: 'varchar', length: 150, name: 'supervisor_nombre', default: 'Supervisor Asignado' })
  supervisorNombre: string;

  get nombre_supervisor_centro(): string {
    return this.supervisorNombre;
  }
  set nombre_supervisor_centro(val: string) {
    this.supervisorNombre = val;
  }

  get contactoNombre(): string {
    return this.supervisorNombre;
  }
  set contactoNombre(val: string) {
    this.supervisorNombre = val;
  }

  get contacto_nombre(): string {
    return this.supervisorNombre;
  }
  set contacto_nombre(val: string) {
    this.supervisorNombre = val;
  }

  @Column({ type: 'varchar', length: 30, name: 'supervisor_telefono', default: '70000000' })
  supervisorTelefono: string;

  get telefono_contacto(): string {
    return this.supervisorTelefono;
  }
  set telefono_contacto(val: string) {
    this.supervisorTelefono = val;
  }

  get contactoTelefono(): string {
    return this.supervisorTelefono;
  }
  set contactoTelefono(val: string) {
    this.supervisorTelefono = val;
  }

  get contacto_telefono(): string {
    return this.supervisorTelefono;
  }
  set contacto_telefono(val: string) {
    this.supervisorTelefono = val;
  }

  @Column({ type: 'varchar', length: 150, name: 'correo', nullable: true, default: 'centro@pastoral.ucb.edu.bo' })
  correo?: string;

  get contactoEmail(): string | undefined {
    return this.correo;
  }
  set contactoEmail(val: string | undefined) {
    this.correo = val;
  }

  get contacto_email(): string | undefined {
    return this.correo;
  }
  set contacto_email(val: string | undefined) {
    this.correo = val;
  }

  @Column({ type: 'date', name: 'fecha_inicio_convenio', nullable: true })
  fechaInicioConvenio?: string;

  get fecha_inicio_convenio(): string | undefined {
    return this.fechaInicioConvenio;
  }
  set fecha_inicio_convenio(val: string | undefined) {
    this.fechaInicioConvenio = val;
  }

  get vigenciaConvenioInicio(): Date | undefined {
    return this.fechaInicioConvenio ? new Date(this.fechaInicioConvenio) : undefined;
  }

  @Column({ type: 'date', name: 'fecha_fin_convenio', nullable: true })
  fechaFinConvenio?: string;

  get fecha_fin_convenio(): string | undefined {
    return this.fechaFinConvenio;
  }
  set fecha_fin_convenio(val: string | undefined) {
    this.fechaFinConvenio = val;
  }

  get vigenciaConvenioFin(): Date | undefined {
    return this.fechaFinConvenio ? new Date(this.fechaFinConvenio) : undefined;
  }

  @Column({ type: 'text', name: 'poblacion_objetivo', default: 'General' })
  poblacionObjetivo: string;

  get poblacion_objetivo(): string {
    return this.poblacionObjetivo;
  }
  set poblacion_objetivo(val: string) {
    this.poblacionObjetivo = val;
  }

  @Column({ type: 'text', name: 'actividades_semestre_actual', default: 'Apoyo y acompañamiento' })
  actividadesSemestreActual: string;

  get actividades_semestre_actual(): string {
    return this.actividadesSemestreActual;
  }
  set actividades_semestre_actual(val: string) {
    this.actividadesSemestreActual = val;
  }

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'monto_pasaje_por_dia', default: 10.00 })
  montoPasajePorDia: number;

  get monto_pasaje_fijo(): number {
    return Number(this.montoPasajePorDia);
  }
  set monto_pasaje_fijo(val: number) {
    this.montoPasajePorDia = val;
  }

  @Column({ type: 'int', name: 'cupo_maximo', default: 15 })
  cupoMaximo: number;

  get cupo_maximo_voluntarios(): number {
    return this.cupoMaximo;
  }
  set cupo_maximo_voluntarios(val: number) {
    this.cupoMaximo = val;
  }

  get cuposTotales(): number {
    return this.cupoMaximo;
  }
  set cuposTotales(val: number) {
    this.cupoMaximo = val;
  }

  get cupos_totales(): number {
    return this.cupoMaximo;
  }
  set cupos_totales(val: number) {
    this.cupoMaximo = val;
  }

  @Column({ type: 'int', name: 'cupo_ocupado', default: 0 })
  cupoOcupado: number;

  get cuposDisponibles(): number {
    return Math.max(0, this.cupoMaximo - this.cupoOcupado);
  }

  get cupos_disponibles(): number {
    return this.cuposDisponibles;
  }

  @Column({ type: 'int', nullable: true, name: 'catolider_titular_id' })
  catolider_titular_id?: number | null;

  @Column({ type: 'int', nullable: true, name: 'catolider_aprendiz_id' })
  catolider_aprendiz_id?: number | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @OneToMany(() => AsignacionUbicacionEntity, (asignacion) => asignacion.proyecto)
  asignaciones: AsignacionUbicacionEntity[];

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;
}
