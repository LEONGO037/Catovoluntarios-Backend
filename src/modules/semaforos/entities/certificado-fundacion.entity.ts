import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ProyectoReceptorEntity } from '../../proyectos/entities/proyecto-receptor.entity';

@Entity('certificados_fundacion')
export class CertificadoFundacionEntity extends BaseEntity {
  @Column({ type: 'int', name: 'id_proyecto' })
  idProyecto: number;

  @ManyToOne(() => ProyectoReceptorEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_proyecto' })
  proyecto: ProyectoReceptorEntity;

  @Column({ type: 'int', name: 'id_usuario' })
  idUsuario: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: UserEntity;

  @Column({ type: 'varchar', length: 20, default: '2/2026' })
  semestre: string;

  @Column({ type: 'varchar', length: 1000, name: 'url_pdf' })
  urlPdf: string;

  @Column({ type: 'varchar', length: 255, name: 'nombre_archivo' })
  nombreArchivo: string;

  @Column({ type: 'int', name: 'subido_por', nullable: true })
  subidoPor?: number;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'subido_por' })
  usuarioSubidor?: UserEntity;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;
}
