import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Actividad extraordinaria convocada por Pastoral (P-18): conciertos, ferias, ceremonias.
 * Suma horas al semestre del voluntario; solo genera pasaje si Pastoral activa la excepción.
 */
@Entity('actividades_emergentes')
export class ActividadEmergenteEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion?: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  lugar?: string | null;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'time', name: 'hora_inicio' })
  horaInicio: string;

  @Column({ type: 'time', name: 'hora_fin' })
  horaFin: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'horas_otorgadas' })
  horasOtorgadas: number;

  @Column({ type: 'boolean', name: 'genera_pasaje', default: false })
  generaPasaje: boolean;

  @Column({ type: 'int', name: 'cupo_maximo', nullable: true })
  cupoMaximo?: number | null;

  @Column({ type: 'varchar', length: 20, default: '2/2026' })
  semestre: string;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @Column({ type: 'int', name: 'creado_por', nullable: true })
  creadoPor?: number | null;
}
