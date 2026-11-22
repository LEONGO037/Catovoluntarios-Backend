import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ProyectoReceptorEntity } from '../../proyectos/entities/proyecto-receptor.entity';
import { RegistroAsistenciaEntity } from '../../asistencia/entities/registro-asistencia.entity';
import { ReporteSemaforoEntity } from '../../semaforos/entities/reporte-semaforo.entity';

@Entity('asignaciones_ubicacion')
export class AsignacionUbicacionEntity extends BaseEntity {
  @Column({ type: 'int', name: 'id_usuario' })
  idUsuario: number;

  @ManyToOne(() => UserEntity, (user) => user.asignaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: UserEntity;

  @Column({ type: 'int', name: 'id_proyecto' })
  idProyecto: number;

  @ManyToOne(() => ProyectoReceptorEntity, (proyecto) => proyecto.asignaciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_proyecto' })
  proyecto: ProyectoReceptorEntity;

  @Column({ type: 'varchar', length: 20, default: '2/2026' })
  semestre: string;

  @Column({ type: 'varchar', length: 20, default: 'Nuevo' })
  condicion: string; // 'Nuevo' | 'Antiguo'

  @Column({ type: 'boolean', name: 'poliza_validada', default: false })
  polizaValidada: boolean;

  @Column({ type: 'boolean', name: 'induccion_completada', default: false })
  induccionCompletada: boolean;

  @Column({ type: 'boolean', name: 'habilitado_campo', default: false })
  habilitadoCampo: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @OneToMany(() => RegistroAsistenciaEntity, (asistencia) => asistencia.asignacion)
  asistencias: RegistroAsistenciaEntity[];

  @OneToMany(() => ReporteSemaforoEntity, (semaforo) => semaforo.asignacion)
  semaforos: ReporteSemaforoEntity[];
}
