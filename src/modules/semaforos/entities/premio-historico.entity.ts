import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('premios_historicos')
export class PremioHistoricoEntity extends BaseEntity {
  @Column({ type: 'int', name: 'id_usuario' })
  idUsuario: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: UserEntity;

  @Column({ type: 'varchar', length: 20 })
  semestre: string;

  @Column({ type: 'varchar', length: 150, name: 'nombre_premio' })
  nombrePremio: string;

  @Column({ type: 'text' })
  descripcion: string;
}
