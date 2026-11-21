import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum RolUsuario {
  ADMIN_PASTORAL = 'ADMIN_PASTORAL',
  CATOLIDER = 'CATOLIDER',
  VOLUNTARIO = 'VOLUNTARIO',
  POSTULANTE = 'POSTULANTE',
}

@Entity('users')
export class UserEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({
    type: 'enum',
    enum: RolUsuario,
    default: RolUsuario.POSTULANTE,
  })
  rol: RolUsuario;

  @Column({ type: 'varchar', length: 100 })
  nombres: string;

  @Column({ type: 'varchar', length: 100, name: 'primer_apellido' })
  primerApellido: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'segundo_apellido' })
  segundoApellido?: string;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  ci: string;

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
}
