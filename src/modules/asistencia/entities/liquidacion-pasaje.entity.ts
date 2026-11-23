import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AsignacionUbicacionEntity } from '../../ubicacion/entities/asignacion-ubicacion.entity';

export enum EstadoPagoPasaje {
  PENDIENTE_FIRMA = 'PENDIENTE_FIRMA',
  FIRMADO_RECIBI_CONFORME = 'FIRMADO_RECIBI_CONFORME',
  DESEMBOLSADO = 'DESEMBOLSADO',
}

/**
 * Liquidación mensual de pasajes por voluntario (P-17). Se genera al conciliar el mes y
 * guarda una foto inmutable del cálculo: días presenciales validados × tarifa fija del proyecto.
 */
@Entity('liquidaciones_pasajes')
export class LiquidacionPasajeEntity extends BaseEntity {
  @Column({ type: 'int', name: 'id_asignacion' })
  idAsignacion: number;

  @ManyToOne(() => AsignacionUbicacionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_asignacion' })
  asignacion?: AsignacionUbicacionEntity;

  @Column({ type: 'int', name: 'id_conciliacion', nullable: true })
  idConciliacion?: number | null;

  @Column({ type: 'int' })
  mes: number;

  @Column({ type: 'int' })
  anio: number;

  @Column({ type: 'int', name: 'dias_presenciales_asistidos', default: 0 })
  diasPresencialesAsistidos: number;

  @Column({ type: 'decimal', precision: 6, scale: 2, name: 'horas_presenciales', default: 0 })
  horasPresenciales: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'tarifa_diaria_aplicada' })
  tarifaDiariaAplicada: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'monto_total_reponer' })
  montoTotalReponer: number;

  @Column({
    type: 'enum',
    enum: EstadoPagoPasaje,
    enumName: 'estado_pago_pasajes_enum',
    name: 'estado_pago',
    default: EstadoPagoPasaje.PENDIENTE_FIRMA,
  })
  estadoPago: EstadoPagoPasaje;

  @Column({ type: 'date', name: 'fecha_pago', nullable: true })
  fechaPago?: string | null;

  @Column({ type: 'varchar', length: 1000, name: 'recibi_conforme_firmado_url', nullable: true })
  recibiConformeFirmadoUrl?: string | null;
}
