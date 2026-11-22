import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
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
  numeroPoliza?: string;

  @Column({ type: 'varchar', length: 50, name: 'id_poliza', nullable: true })
  idPoliza?: string;

  @Column({ type: 'varchar', length: 50, name: 'numero_certificado', nullable: true })
  numeroCertificado?: string;

  @Column({ type: 'date', name: 'vigencia_inicio', nullable: true })
  vigenciaInicio?: Date;

  @Column({ type: 'date', name: 'vigencia_fin', nullable: true })
  vigenciaFin?: Date;

  @Column({ type: 'varchar', length: 150, nullable: true })
  asegurado?: string;

  @Column({
    type: 'enum',
    enum: EstadoDocumento,
    default: EstadoDocumento.PENDIENTE,
  })
  estado: EstadoDocumento;

  @Column({ type: 'text', name: 'observaciones_validacion', nullable: true })
  observacionesValidacion?: string;

  @Column({ type: 'int', name: 'validado_por', nullable: true })
  validadoPor?: number;

  @Column({ type: 'timestamp with time zone', name: 'fecha_validacion', nullable: true })
  fechaValidacion?: Date;
}
