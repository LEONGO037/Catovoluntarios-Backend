import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from '../../../common/enums/role.enum';
import { PostulacionEntity } from '../../postulaciones/entities/postulacion.entity';
import { AsignacionUbicacionEntity } from '../../ubicacion/entities/asignacion-ubicacion.entity';

export const RolUsuario = Role;
export type RolUsuario = Role;

@Entity('usuarios')
export class UserEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20, unique: true })
  ci: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  get password(): string {
    return this.passwordHash;
  }
  set password(val: string) {
    this.passwordHash = val;
  }

  @Column({ type: 'varchar', length: 100 })
  nombres: string;

  @Column({ type: 'varchar', length: 100, name: 'primer_apellido' })
  primerApellido: string;

  @Column({ type: 'varchar', length: 100, name: 'segundo_apellido', nullable: true })
  segundoApellido?: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.POSTULANTE,
  })
  rol: Role;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  carrera?: string;

  @Column({ type: 'varchar', length: 20, name: 'semestre_ingreso', nullable: true })
  semestreIngreso?: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  // Campos específicos de liderazgo semestral (M02 - P-06B)
  @Column({ type: 'boolean', default: false, name: 'es_catolider_vigente' })
  esCatoliderVigente: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'semestre_liderazgo' })
  semestreLiderazgo?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'modalidad_liderazgo' })
  modalidadLiderazgo?: string;

  @Column({ type: 'int', nullable: true, name: 'proyecto_receptor_asignado_id' })
  proyectoReceptorAsignadoId?: number;

  @OneToMany(() => PostulacionEntity, (postulacion) => postulacion.usuario)
  postulaciones: PostulacionEntity[];

  @OneToMany(() => AsignacionUbicacionEntity, (asignacion) => asignacion.usuario)
  asignaciones: AsignacionUbicacionEntity[];
}
