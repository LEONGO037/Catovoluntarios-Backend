import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('postulaciones')
export class PostulacionEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true, name: 'codigo_postulacion' })
  codigoPostulacion: string;

  @Column({ type: 'int', name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, (user) => user.postulaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  usuario: UserEntity;

  @Column({ type: 'varchar', length: 50, name: 'tipo_relacion_ucb', default: 'Estudiante Regular' })
  tipoRelacionUcb: string;

  @Column({ type: 'date', name: 'fecha_nacimiento' })
  fechaNacimiento: Date;

  @Column({ type: 'int', name: 'edad_calculada' })
  edadCalculada: number;

  @Column({ type: 'int', name: 'numero_materias' })
  numeroMaterias: number;

  @Column({ type: 'boolean', name: 'tiene_materias_pesadas', default: false })
  tieneMateriasPesadas: boolean;

  @Column({ type: 'text', name: 'detalle_materias_pesadas', nullable: true })
  detalleMateriasPesadas?: string;

  @Column({ type: 'int', name: 'actividades_extracurriculares', default: 0 })
  actividadesExtracurriculares: number;

  @Column({ type: 'text', name: 'detalle_actividades', nullable: true })
  detalleActividades?: string;

  @Column({ type: 'boolean', name: 'menor_edad', default: false })
  menorEdad: boolean;

  @Column({ type: 'boolean', name: 'autorizacion_padres', default: false })
  autorizacionPadres: boolean;

  @Column({ type: 'boolean', name: 'experiencia_previa', default: false })
  experienciaPrevia: boolean;

  @Column({ type: 'text', name: 'detalle_experiencia', nullable: true })
  detalleExperiencia?: string;

  @Column({ type: 'text', name: 'habilidades', nullable: true })
  habilidades?: string;

  @Column({ type: 'varchar', length: 255, name: 'tres_palabras_personalidad', nullable: true })
  tresPalabrasPersonalidad?: string;

  @Column({ type: 'text', name: 'alergias_condiciones_medicas', nullable: true })
  alergiasCondicionesMedicas?: string;

  @Column({ type: 'text', name: 'poblaciones_interes', nullable: true })
  poblacionesInteres?: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'estado_postulacion',
    default: 'PENDIENTE',
  })
  estadoPostulacion: string;

  @Column({ type: 'varchar', length: 20, default: '2/2026' })
  semestre: string;
}
