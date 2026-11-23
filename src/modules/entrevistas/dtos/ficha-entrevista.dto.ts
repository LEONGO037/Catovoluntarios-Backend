import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { DiaSemana, DictamenEntrevista } from '../enums/entrevistas.enums';

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

export class HorarioDisponibleDto {
  @IsEnum(DiaSemana, { message: 'dia no es un día de la semana válido' })
  dia: DiaSemana;

  @Matches(FORMATO_HORA, { message: 'horaInicio debe tener el formato HH:mm' })
  horaInicio: string;

  @Matches(FORMATO_HORA, { message: 'horaFin debe tener el formato HH:mm' })
  horaFin: string;
}

/** P-08: ficha digital de entrevista. */
export class RegistrarFichaEntrevistaDto {
  // Bloque 1 — Motivación y expectativas
  @IsOptional()
  @IsString()
  observacionesMotivacion?: string;

  // Bloque 2 — Compromiso y autonomía
  @IsOptional()
  @IsString()
  manejoTransporte?: string;

  @IsOptional()
  @IsString()
  tiempoSemanal?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => HorarioDisponibleDto)
  horariosDisponibles?: HorarioDisponibleDto[];

  @IsOptional()
  @IsString()
  observacionesCompromiso?: string;

  // Bloque 3 — Trabajo en equipo y resolución de conflictos
  @IsOptional()
  @IsString()
  observacionesTrabajoEquipo?: string;

  // Bloque 4 — Apertura y afinidad con el carisma católico (1 a 10)
  @IsInt({ message: 'aperturaReligiosaEscala debe ser un entero' })
  @Min(1)
  @Max(10)
  aperturaReligiosaEscala: number;

  // Bloque 5 — Observaciones y recomendaciones
  @IsOptional()
  @IsString()
  observacionesRecomendaciones?: string;

  @IsInt({ message: 'proyectoReceptorSugeridoId es obligatorio' })
  proyectoReceptorSugeridoId: number;

  @IsEnum(DictamenEntrevista, {
    message: 'dictamen debe ser RECOMENDADO, RECOMENDADO_CON_OBSERVACION o NO_RECOMENDADO',
  })
  dictamen: DictamenEntrevista;
}
