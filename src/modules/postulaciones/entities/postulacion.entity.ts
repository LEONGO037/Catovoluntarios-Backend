import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

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
  @Column({ type: 'varchar', length: 30, name: 'codigo_postulacion' })
  codigoPostulacion: string;

  @Column({
    type: 'enum',
    enum: TipoRelacionUcb,
    default: TipoRelacionUcb.ESTUDIANTE_REGULAR,
    name: 'tipo_relacion_ucb',
  })
  tipoRelacionUcb: TipoRelacionUcb;

  @Column({ type: 'varchar', length: 100 })
  nombres: string;

  @Column({ type: 'varchar', length: 100, name: 'primer_apellido' })
  primerApellido: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'segundo_apellido' })
  segundoApellido?: string;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  ci: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  complemento?: string;

  @Column({ type: 'varchar', length: 10, default: 'LP' })
  expedido: string;

  @Column({ type: 'date', name: 'fecha_nacimiento' })
  fechaNacimiento: string;

  @Column({ type: 'int' })
  edad: number;

  @Column({ type: 'varchar', length: 15 })
  celular: string;

  @Column({ type: 'varchar', length: 150, name: 'correo_electronico' })
  correoElectronico: string;

  // Carrera: Opcional o 'N/A' para no estudiantes (Familiares / Externos)
  @Column({ type: 'varchar', length: 150, default: 'N/A' })
  carrera: string;

  @Column({ type: 'varchar', length: 200, name: 'zona_residencia' })
  zonaResidencia: string;

  // Paso 2: Control de Carga Académica
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

  // Paso 3: Perfil y Vocación
  @Column({ type: 'boolean', default: false, name: 'experiencia_voluntariado_previa' })
  experienciaVoluntariadoPrevia: boolean;

  @Column({ type: 'text', nullable: true, name: 'detalle_experiencia' })
  detalleExperiencia?: string;

  @Column({ type: 'jsonb', default: () => "'[]'", name: 'habilidades_destacadas' })
  habilidadesDestacadas: string[];

  @Column({ type: 'boolean', default: false, name: 'conocimiento_computacion' })
  conocimientoComputacion: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'", name: 'tres_palabras_personalidad' })
  tresPalabrasPersonalidad: string[];

  @Column({ type: 'text', nullable: true, name: 'alergias_condiciones_medicas' })
  alergiasCondicionesMedicas?: string;

  @Column({ type: 'jsonb', default: () => "'[]'", name: 'poblaciones_interes' })
  poblacionesInteres: string[];

  // Paso 4: Consentimiento
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
  })
  estado: EstadoPostulacion;

  @Column({ type: 'text', nullable: true, name: 'observaciones_postulacion' })
  observacionesPostulacion?: string;

  @Column({ type: 'int', nullable: true, name: 'user_id' })
  userId?: number;
}
