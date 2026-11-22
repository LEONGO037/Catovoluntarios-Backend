import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from '../../../common/enums/role.enum';
import { PostulacionEntity } from '../../postulaciones/entities/postulacion.entity';
import { AsignacionUbicacionEntity } from '../../ubicacion/entities/asignacion-ubicacion.entity';

@Entity('usuarios')
export class UserEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  ci: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

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

  @OneToMany(() => PostulacionEntity, (postulacion) => postulacion.usuario)
  postulaciones: PostulacionEntity[];

  @OneToMany(() => AsignacionUbicacionEntity, (asignacion) => asignacion.usuario)
  asignaciones: AsignacionUbicacionEntity[];
}
