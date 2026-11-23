import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  DiaSemana,
  DictamenEntrevista,
  EstadoCitaEntrevista,
} from '../enums/entrevistas.enums';

export interface HorarioDisponible {
  dia: DiaSemana;
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
}

/**
 * Tabla `entrevistas` de init.sql (P-07 cita + P-08 ficha en una sola fila).
 * synchronize: false → la estructura la definen init.sql y las migraciones.
 * No extiende BaseEntity porque la tabla no tiene created_at/updated_at.
 */
@Entity({ name: 'entrevistas', synchronize: false })
export class EntrevistaEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'postulacion_id', unique: true })
  postulacionId: number;

  @Column({ type: 'int', name: 'catolider_id', nullable: true })
  catoliderId: number | null;

  @Column({ type: 'timestamp with time zone', name: 'fecha_hora_programada' })
  fechaHoraProgramada: Date;

  @Column({
    type: 'enum',
    enum: EstadoCitaEntrevista,
    enumName: 'estado_cita_entrevista_enum',
    default: EstadoCitaEntrevista.PROGRAMADA,
  })
  estado: EstadoCitaEntrevista;

  @Column({ type: 'int', name: 'apertura_religiosa_escala', nullable: true })
  aperturaReligiosaEscala: number | null;

  @Column({ type: 'int', name: 'proyecto_receptor_sugerido_id', nullable: true })
  proyectoReceptorSugeridoId: number | null;

  @Column({ type: 'text', name: 'observaciones_motivacion', nullable: true })
  observacionesMotivacion: string | null;

  @Column({ type: 'text', name: 'observaciones_compromiso', nullable: true })
  observacionesCompromiso: string | null;

  @Column({ type: 'text', name: 'observaciones_trabajo_equipo', nullable: true })
  observacionesTrabajoEquipo: string | null;

  @Column({ type: 'text', name: 'observaciones_recomendaciones', nullable: true })
  observacionesRecomendaciones: string | null;

  @Column({
    type: 'enum',
    enum: DictamenEntrevista,
    enumName: 'dictamen_entrevista_enum',
    nullable: true,
  })
  dictamen: DictamenEntrevista | null;

  // ---- Columnas agregadas por la migración M03 ----
  @Column({ type: 'text', name: 'manejo_transporte', nullable: true })
  manejoTransporte: string | null;

  @Column({ type: 'text', name: 'tiempo_semanal', nullable: true })
  tiempoSemanal: string | null;

  @Column({ type: 'jsonb', name: 'horarios_disponibles', nullable: true })
  horariosDisponibles: HorarioDisponible[] | null;
}
