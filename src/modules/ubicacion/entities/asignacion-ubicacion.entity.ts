import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ProyectoReceptorEntity } from '../../proyectos/entities/proyecto-receptor.entity';
import { RegistroAsistenciaEntity } from '../../asistencia/entities/registro-asistencia.entity';
import { ReporteSemaforoEntity } from '../../semaforos/entities/reporte-semaforo.entity';

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
export class AsignacionUbicacionEntity extends BaseEntity {
  get id_asignacion(): number {
    return this.id;
  }
  set id_asignacion(val: number) {
    this.id = val;
  }

  @Column({ type: 'int', name: 'id_usuario' })
  idUsuario: number;

  get id_usuario(): number {
    return this.idUsuario;
  }
  set id_usuario(val: number) {
    this.idUsuario = val;
  }

  @ManyToOne(() => UserEntity, (user) => user.asignaciones, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'id_usuario' })
  usuario?: UserEntity;

  @Column({ type: 'int', name: 'id_proyecto' })
  idProyecto: number;

  get id_proyecto(): number {
    return this.idProyecto;
  }
  set id_proyecto(val: number) {
    this.idProyecto = val;
  }

  @ManyToOne(() => ProyectoReceptorEntity, (proyecto) => proyecto.asignaciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_proyecto' })
  proyecto: ProyectoReceptorEntity;

  @Column({ type: 'varchar', length: 20, default: '2/2026' })
  semestre: string;

  @Column({ type: 'varchar', length: 20, default: 'Nuevo' })
  condicion: string; // 'Nuevo' | 'Antiguo'

  @Column({ type: 'varchar', length: 150, name: 'horario_comprometido', default: '' })
  horario_comprometido: string;

  get horarioComprometido(): string {
    return this.horario_comprometido;
  }
  set horarioComprometido(val: string) {
    this.horario_comprometido = val;
  }

  @Column({ type: 'boolean', name: 'poliza_validada', default: false })
  polizaValidada: boolean;

  get poliza_validada(): boolean {
    return this.polizaValidada;
  }
  set poliza_validada(val: boolean) {
    this.polizaValidada = val;
  }

  @Column({ type: 'boolean', name: 'induccion_completada', default: false })
  induccionCompletada: boolean;

  get induccion_completada(): boolean {
    return this.induccionCompletada;
  }
  set induccion_completada(val: boolean) {
    this.induccionCompletada = val;
  }

  @Column({ type: 'boolean', name: 'habilitado_campo', default: false })
  habilitadoCampo: boolean;

  get habilitado_campo(): boolean {
    return this.habilitadoCampo;
  }
  set habilitado_campo(val: boolean) {
    this.habilitadoCampo = val;
  }

  @Column({ type: 'varchar', length: 20, default: 'Activo' })
  estado: string; // 'Activo' | 'Reasignado' | 'Retirado'

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @OneToMany(() => RegistroAsistenciaEntity, (asistencia) => asistencia.asignacion)
  asistencias: RegistroAsistenciaEntity[];

  @OneToMany(() => ReporteSemaforoEntity, (semaforo) => semaforo.asignacion)
  semaforos: ReporteSemaforoEntity[];
}
