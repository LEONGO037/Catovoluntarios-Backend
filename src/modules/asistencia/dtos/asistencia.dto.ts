import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** P-18 / P-16: el Catovoluntario registra su jornada al concluirla. */
export class MarcarAsistenciaDto {
  @Matches(FECHA, { message: 'La fecha debe tener el formato AAAA-MM-DD' })
  fecha: string;

  @Matches(HORA, { message: 'La hora de ingreso debe tener el formato HH:MM' })
  horaIngreso: string;

  @Matches(HORA, { message: 'La hora de salida debe tener el formato HH:MM' })
  horaSalida: string;

  @IsString()
  @IsNotEmpty({ message: 'Describe brevemente las tareas que realizaste' })
  @MaxLength(1000)
  tareasRealizadas: string;

  @IsOptional()
  @IsIn(['PRESENCIAL', 'NO_PRESENCIAL'], { message: 'El tipo debe ser PRESENCIAL o NO_PRESENCIAL' })
  tipoActividad?: 'PRESENCIAL' | 'NO_PRESENCIAL';
}

/** P-16: el Catolíder aprueba u observa el registro. Observar exige un comentario. */
export class AprobarAsistenciaDto {
  @IsBoolean()
  aprobado: boolean;

  @ValidateIf((o: AprobarAsistenciaDto) => o.aprobado === false)
  @IsString()
  @IsNotEmpty({ message: 'Indica el motivo de la observación' })
  @MaxLength(1000)
  observaciones?: string;
}

/** Filtro de mes para consultas (P-16 / P-17). */
export class FiltroMesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  anio?: number;
}

export class FiltroProyectoMesDto extends FiltroMesDto {
  @Type(() => Number)
  @IsInt({ message: 'Selecciona un proyecto receptor' })
  proyectoId: number;
}

/** P-16: cierre mensual de Pastoral contra la planilla física del supervisor del centro. */
export class ConciliarMesDto {
  @Type(() => Number)
  @IsInt()
  proyectoId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @Type(() => Number)
  @IsInt()
  @Min(2020)
  anio: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}

/** P-18: Pastoral habilita una actividad emergente. */
export class CrearActividadEmergenteDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la actividad es obligatorio' })
  @MaxLength(200)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  lugar?: string;

  @Matches(FECHA, { message: 'La fecha debe tener el formato AAAA-MM-DD' })
  fecha: string;

  @Matches(HORA, { message: 'La hora de inicio debe tener el formato HH:MM' })
  horaInicio: string;

  @Matches(HORA, { message: 'La hora de fin debe tener el formato HH:MM' })
  horaFin: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  @Max(24)
  horasOtorgadas?: number;

  @IsOptional()
  @IsBoolean()
  generaPasaje?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cupoMaximo?: number;
}

export class ActualizarActividadEmergenteDto {
  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsBoolean()
  generaPasaje?: boolean;
}

/** P-18: el voluntario se registra como participante de una actividad emergente. */
export class ParticiparActividadEmergenteDto {
  @Type(() => Number)
  @IsInt()
  actividadId: number;
}
