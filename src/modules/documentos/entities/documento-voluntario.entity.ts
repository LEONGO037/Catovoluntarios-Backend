import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

export enum TipoDocumento {
  POLIZA_ACCIDENTES_APC7083 = 'POLIZA_ACCIDENTES_APC7083',
  COMPROMISO_VOLUNTARIADO = 'COMPROMISO_VOLUNTARIADO',
  CI_ANVERSO_REVERSO = 'CI_ANVERSO_REVERSO',
  CARTA_AUTORIZACION_PADRES_MENOR = 'CARTA_AUTORIZACION_PADRES_MENOR',
  CI_PADRE_TUTOR_MENOR = 'CI_PADRE_TUTOR_MENOR',
  OTRO_RESPALDO = 'OTRO_RESPALDO',
}

export enum EstadoDocumento {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  OBSERVADO = 'OBSERVADO',
  RECHAZADO = 'RECHAZADO',
}

@Entity('documentos_voluntario')
@Index('idx_documentos_usuario_gestion_tipo', ['userId', 'semestre', 'tipoDocumento'])
@Index('idx_documentos_gestion_envio', ['semestre', 'enviadoRevisionEn'])
export class DocumentoVoluntarioEntity extends BaseEntity {
  @Column({ type: 'int', name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  usuario: UserEntity;

  @Column({ type: 'varchar', length: 20, default: '2/2026' })
  semestre: string;

  @Column({
    type: 'enum',
    enum: TipoDocumento,
    name: 'tipo_documento',
  })
  tipoDocumento: TipoDocumento;

  @Column({ type: 'varchar', length: 1000, name: 'archivo_url' })
  archivoUrl: string;

  @Column({ type: 'varchar', length: 255, name: 'nombre_archivo_original', nullable: true })
  nombreArchivoOriginal?: string;

  @Column({ type: 'varchar', length: 50, name: 'numero_poliza', nullable: true })
  numeroPoliza: string | null;

  @Column({ type: 'varchar', length: 50, name: 'id_poliza', nullable: true })
  idPoliza: string | null;

  @Column({ type: 'varchar', length: 50, name: 'numero_certificado', nullable: true })
  numeroCertificado: string | null;

  @Column({ type: 'date', name: 'vigencia_inicio', nullable: true })
  vigenciaInicio: string | null;

  @Column({ type: 'date', name: 'vigencia_fin', nullable: true })
  vigenciaFin: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  asegurado: string | null;

  @Column({
    type: 'enum',
    enum: EstadoDocumento,
    default: EstadoDocumento.PENDIENTE,
  })
  estado: EstadoDocumento;

  @Column({ type: 'text', name: 'observacion_detalle', nullable: true })
  observacionesValidacion: string | null;

  @Column({ type: 'int', name: 'validado_por', nullable: true })
  validadoPor: number | null;

  @Column({ type: 'timestamp with time zone', name: 'fecha_validacion', nullable: true })
  fechaValidacion: Date | null;

  @Column({ type: 'timestamp with time zone', name: 'enviado_revision_en', nullable: true })
  enviadoRevisionEn: Date | null;
}
