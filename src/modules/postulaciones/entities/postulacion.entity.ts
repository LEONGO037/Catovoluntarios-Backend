import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

export enum EstadoPostulacion {
  PENDIENTE = 'PENDIENTE',
  APTO_ENTREVISTA = 'APTO_ENTREVISTA',
  OBSERVADO_SOBRECARGA = 'OBSERVADO_SOBRECARGA',
  DESCARTADO = 'DESCARTADO',
}

export enum TipoRelacionUcb {
  ESTUDIANTE_REGULAR = 'Estudiante Regular',
  TITULADO_ALUMNI = 'Titulado/Alumni',
  DOCENTE = 'Docente',
  ADMINISTRATIVO = 'Administrativo',
  FAMILIAR_PERSONAL = 'Familiar de personal UCB',
  EXTERNO_AUTORIZADO = 'Externo autorizado',
}

@Entity('postulaciones')
export class PostulacionEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, name: 'codigo_postulacion' })
  codigoPostulacion: string;

  @Column({ type: 'int', name: 'user_id', nullable: true })
  userId?: number;

  @ManyToOne(() => UserEntity, (user) => user.postulaciones, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  usuario?: UserEntity;

  @Column({
    type: 'enum',
    enum: TipoRelacionUcb,
    default: TipoRelacionUcb.ESTUDIANTE_REGULAR,
    name: 'tipo_relacion_ucb',
  })
  tipoRelacionUcb: TipoRelacionUcb;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nombres?: string;

  @Column({ type: 'varchar', length: 100, name: 'primer_apellido', nullable: true })
  primerApellido?: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'segundo_apellido' })
  segundoApellido?: string;

  @Index()
  @Column({ type: 'varchar', length: 20, nullable: true })
  ci?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  complemento?: string;

  @Column({ type: 'varchar', length: 10, default: 'LP' })
  expedido: string;

  @Column({ type: 'date', name: 'fecha_nacimiento' })
  fechaNacimiento: string;

  @Column({ type: 'int', name: 'edad_calculada', default: 18 })
  edadCalculada: number;

  get edad_calculada(): number {
    return this.edadCalculada;
  }
  set edad_calculada(val: number) {
    this.edadCalculada = val;
  }

  get edad(): number {
    return this.edadCalculada;
  }
  set edad(val: number) {
    this.edadCalculada = val;
  }

  @Column({ type: 'varchar', length: 20, nullable: true })
  celular?: string;

  @Column({ type: 'varchar', length: 150, name: 'correo_electronico', nullable: true })
  correoElectronico?: string;

  @Column({ type: 'varchar', length: 150, default: 'N/A' })
  carrera: string;

  @Column({ type: 'varchar', length: 200, name: 'zona_residencia', default: 'Central' })
  zonaResidencia: string;

  @Column({ type: 'int', name: 'numero_materias', default: 0 })
  numeroMaterias: number;

  @Column({ type: 'boolean', default: false, name: 'tiene_materias_pesadas' })
  tieneMateriasPesadas: boolean;

  @Column({ type: 'text', nullable: true, name: 'detalle_materias_pesadas' })
  detalleMateriasPesadas?: string;

  @Column({ type: 'int', default: 0, name: 'actividades_extracurriculares' })
  actividadesExtracurriculares: number;

  @Column({ type: 'text', nullable: true, name: 'detalle_actividades' })
  detalleActividades?: string;

  @Column({ type: 'boolean', default: false, name: 'experiencia_voluntariado_previa' })
  experienciaVoluntariadoPrevia: boolean;

  @Column({ type: 'text', nullable: true, name: 'detalle_experiencia' })
  detalleExperiencia?: string;

  @Column({ type: 'jsonb', default: () => "'[]'", name: 'habilidades_destacadas', nullable: true })
  habilidadesDestacadas?: string[];

  @Column({ type: 'boolean', default: false, name: 'conocimiento_computacion' })
  conocimientoComputacion: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'", name: 'tres_palabras_personalidad', nullable: true })
  tresPalabrasPersonalidad?: string[];

  @Column({ type: 'text', nullable: true, name: 'alergias_condiciones_medicas' })
  alergiasCondicionesMedicas?: string;

  @Column({ type: 'jsonb', default: () => "'[]'", name: 'poblaciones_interes', nullable: true })
  poblacionesInteres?: string[];

  @Column({ type: 'boolean', default: false, name: 'requiere_autorizacion_padres' })
  requiereAutorizacionPadres: boolean;

  @Column({ type: 'boolean', default: false, name: 'autorizacion_padres_confirmada' })
  autorizacionPadresConfirmada: boolean;

  @Column({ type: 'boolean', default: true, name: 'compromiso_aceptado' })
  compromisoAceptado: boolean;

  @Column({
    type: 'enum',
    enum: EstadoPostulacion,
    default: EstadoPostulacion.PENDIENTE,
    name: 'estado_postulacion',
  })
  estado: EstadoPostulacion;

  get estadoPostulacion(): string {
    return this.estado;
  }
  set estadoPostulacion(val: string) {
    this.estado = val as EstadoPostulacion;
  }

  @Column({ type: 'text', nullable: true, name: 'observaciones_postulacion' })
  observacionesPostulacion?: string;

  @Column({ type: 'varchar', length: 20, default: '2/2026' })
  semestre: string;
}
