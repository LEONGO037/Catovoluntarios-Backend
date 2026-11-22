import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';
import { ProyectoReceptorEntity } from '../../proyectos/entities/proyecto-receptor.entity';

@Entity('premios_historicos')
export class PremioHistoricoEntity extends BaseEntity {
  @Column({ type: 'int', name: 'id_usuario' })
  idUsuario: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: UserEntity;

  @Column({ type: 'varchar', length: 20, default: '2/2026' })
  semestre: string;

  @Column({ type: 'int', name: 'proyecto_id', nullable: true })
  proyectoId?: number;

  @ManyToOne(() => ProyectoReceptorEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'proyecto_id' })
  proyecto?: ProyectoReceptorEntity;

  @Column({ type: 'varchar', length: 150, name: 'nombre_premio' })
  nombrePremio: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  categoria?: string; // 'Liderazgo en Campo' | 'Puntualidad y Compromiso' | 'Super Pro'

  @Column({ type: 'text' })
  descripcion: string;
}
