import { IsIn, IsISO8601, IsOptional, Matches } from 'class-validator';
import { ESTADOS_MARCADO_RAPIDO, EstadoCitaEntrevista } from '../enums/entrevistas.enums';

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export class DisponibilidadQueryDto {
  /** Cualquier fecha de la semana a consultar (YYYY-MM-DD). Por defecto, la semana actual. */
  @IsOptional()
  @Matches(FORMATO_FECHA, { message: 'semana debe tener el formato YYYY-MM-DD' })
  semana?: string;
}

export class CitasDelDiaQueryDto {
  @Matches(FORMATO_FECHA, { message: 'fecha debe tener el formato YYYY-MM-DD' })
  fecha: string;
}

export class AgendarEntrevistaDto {
  /** Inicio de la franja elegida, en ISO 8601 (tal como lo devuelve /disponibilidad). */
  @IsISO8601({ strict: true }, { message: 'fechaHora debe ser una fecha ISO 8601 válida' })
  fechaHora: string;
}

export class ReprogramarEntrevistaDto {
  @IsISO8601({ strict: true }, { message: 'fechaHora debe ser una fecha ISO 8601 válida' })
  fechaHora: string;
}

export class CambiarEstadoCitaDto {
  @IsIn(ESTADOS_MARCADO_RAPIDO, {
    message: 'estado debe ser ASISTIO, FALTO o REPROGRAMADA',
  })
  estado: EstadoCitaEntrevista;
}
