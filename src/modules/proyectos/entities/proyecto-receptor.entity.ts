import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AsignacionUbicacionEntity } from '../../ubicacion/entities/asignacion-ubicacion.entity';
import { InstitucionEntity } from './institucion.entity';

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

  @Column({ type: 'int', name: 'id_institucion', nullable: true })
  id_institucion: number | null;

  @ManyToOne(() => InstitucionEntity, (institucion) => institucion.proyectos, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'id_institucion' })
  institucion?: InstitucionEntity | null;

  @Column({ type: 'varchar', length: 20, name: 'semestre', default: '2/2026' })
  semestre: string;

  get gestion(): string {
    return this.semestre;
  }
  set gestion(val: string) {
    this.semestre = val;
  }

  @Column({ type: 'varchar', length: 200, name: 'nombre_proyecto' })
  nombre_proyecto: string;

  get nombreProyecto(): string {
    return this.nombre_proyecto;
  }
  set nombreProyecto(val: string) {
    this.nombre_proyecto = val;
  }

  @Column({
    type: 'varchar',
    length: 255,
    name: 'direccion_exacta',
    default: '',
  })
  direccion_exacta: string;

  get direccionExacta(): string {
    return this.direccion_exacta;
  }
  set direccionExacta(val: string) {
    this.direccion_exacta = val;
  }

  get direccion(): string {
    return this.direccion_exacta;
  }
  set direccion(val: string) {
    this.direccion_exacta = val;
  }

  @Column({
    type: 'varchar',
    length: 100,
    name: 'macrodistrito_zona',
    default: 'Centro',
  })
  macrodistrito_zona: string;

  get macrodistritoZona(): string {
    return this.macrodistrito_zona;
  }
  set macrodistritoZona(val: string) {
    this.macrodistrito_zona = val;
  }

  get zona(): string {
    return this.macrodistrito_zona;
  }
  set zona(val: string) {
    this.macrodistrito_zona = val;
  }

  @Column({ type: 'int', nullable: true, name: 'usuario_supervisor_id' })
  usuarioSupervisorId?: number | null;

  @Column({
    type: 'varchar',
    length: 150,
    name: 'supervisor_nombre',
    default: 'Supervisor Asignado',
  })
  supervisor_nombre: string;

  get supervisorNombre(): string {
    return this.supervisor_nombre;
  }
  set supervisorNombre(val: string) {
    this.supervisor_nombre = val;
  }

  get nombre_supervisor_centro(): string {
    return this.supervisor_nombre;
  }
  set nombre_supervisor_centro(val: string) {
    this.supervisor_nombre = val;
  }

  get contactoNombre(): string {
    return this.supervisor_nombre;
  }
  set contactoNombre(val: string) {
    this.supervisor_nombre = val;
  }

  get contacto_nombre(): string {
    return this.supervisor_nombre;
  }
  set contacto_nombre(val: string) {
    this.supervisor_nombre = val;
  }

  @Column({
    type: 'varchar',
    length: 30,
    name: 'supervisor_telefono',
    default: '70000000',
  })
  supervisor_telefono: string;

  get supervisorTelefono(): string {
    return this.supervisor_telefono;
  }
  set supervisorTelefono(val: string) {
    this.supervisor_telefono = val;
  }

  get telefono_contacto(): string {
    return this.supervisor_telefono;
  }
  set telefono_contacto(val: string) {
    this.supervisor_telefono = val;
  }

  get contactoTelefono(): string {
    return this.supervisor_telefono;
  }
  set contactoTelefono(val: string) {
    this.supervisor_telefono = val;
  }

  get contacto_telefono(): string {
    return this.supervisor_telefono;
  }
  set contacto_telefono(val: string) {
    this.supervisor_telefono = val;
  }

  @Column({
    type: 'varchar',
    length: 150,
    name: 'correo',
    nullable: true,
    default: 'centro@pastoral.ucb.edu.bo',
  })
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
  fecha_inicio_convenio?: string;

  get fechaInicioConvenio(): string | undefined {
    return this.fecha_inicio_convenio;
  }
  set fechaInicioConvenio(val: string | undefined) {
    this.fecha_inicio_convenio = val;
  }

  get vigenciaConvenioInicio(): Date | undefined {
    return this.fecha_inicio_convenio
      ? new Date(this.fecha_inicio_convenio)
      : undefined;
  }

  @Column({ type: 'date', name: 'fecha_fin_convenio', nullable: true })
  fecha_fin_convenio?: string;

  get fechaFinConvenio(): string | undefined {
    return this.fecha_fin_convenio;
  }
  set fechaFinConvenio(val: string | undefined) {
    this.fecha_fin_convenio = val;
  }

  get vigenciaConvenioFin(): Date | undefined {
    return this.fecha_fin_convenio
      ? new Date(this.fecha_fin_convenio)
      : undefined;
  }

  @Column({ type: 'text', name: 'poblacion_objetivo', default: 'General' })
  poblacion_objetivo: string;

  get poblacionObjetivo(): string {
    return this.poblacion_objetivo;
  }
  set poblacionObjetivo(val: string) {
    this.poblacion_objetivo = val;
  }

  @Column({
    type: 'text',
    name: 'actividades_semestre_actual',
    default: 'Apoyo y acompañamiento',
  })
  actividades_semestre_actual: string;

  get actividadesSemestreActual(): string {
    return this.actividades_semestre_actual;
  }
  set actividadesSemestreActual(val: string) {
    this.actividades_semestre_actual = val;
  }

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'monto_pasaje_por_dia',
    default: 10.0,
  })
  monto_pasaje_por_dia: number;

  get montoPasajePorDia(): number {
    return Number(this.monto_pasaje_por_dia);
  }
  set montoPasajePorDia(val: number) {
    this.monto_pasaje_por_dia = val;
  }

  get monto_pasaje_fijo(): number {
    return Number(this.monto_pasaje_por_dia);
  }
  set monto_pasaje_fijo(val: number) {
    this.monto_pasaje_por_dia = val;
  }

  @Column({ type: 'int', name: 'cupo_maximo', default: 15 })
  cupo_maximo: number;

  get cupoMaximo(): number {
    return this.cupo_maximo;
  }
  set cupoMaximo(val: number) {
    this.cupo_maximo = val;
  }

  get cupo_maximo_voluntarios(): number {
    return this.cupo_maximo;
  }
  set cupo_maximo_voluntarios(val: number) {
    this.cupo_maximo = val;
  }

  get cuposTotales(): number {
    return this.cupo_maximo;
  }
  set cuposTotales(val: number) {
    this.cupo_maximo = val;
  }

  get cupos_totales(): number {
    return this.cupo_maximo;
  }
  set cupos_totales(val: number) {
    this.cupo_maximo = val;
  }

  @Column({ type: 'int', name: 'cupo_ocupado', default: 0 })
  cupoOcupado: number;

  get cuposDisponibles(): number {
    return Math.max(0, this.cupo_maximo - this.cupoOcupado);
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
