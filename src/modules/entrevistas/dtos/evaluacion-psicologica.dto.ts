import { Transform, TransformFnParams } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { DictamenPsicologico, PoblacionSugerida } from '../enums/entrevistas.enums';

/**
 * Los datos llegan como multipart/form-data (junto con el PDF), por eso todos
 * los valores son texto: los números se convierten de forma implícita y las
 * poblaciones se aceptan como campo repetido o como lista separada por comas.
 */
function aListaDePoblaciones({ obj, key }: TransformFnParams): unknown {
  const valor: unknown = (obj as Record<string, unknown>)[key];
  if (Array.isArray(valor)) return valor;
  if (typeof valor === 'string') {
    return valor
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }
  return valor;
}

// DECIMAL(5,2) en init.sql: máximo 999.99. No se fija otra escala porque no está definida.
const PUNTAJE_MAXIMO = 999.99;

class CamposEvaluacionDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'socializacion debe ser numérico' })
  @Min(0)
  @Max(PUNTAJE_MAXIMO)
  socializacion?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'eficacia debe ser numérico' })
  @Min(0)
  @Max(PUNTAJE_MAXIMO)
  eficacia?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'proactividad debe ser numérico' })
  @Min(0)
  @Max(PUNTAJE_MAXIMO)
  proactividad?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'gestionPersonal debe ser numérico' })
  @Min(0)
  @Max(PUNTAJE_MAXIMO)
  gestionPersonal?: number;

  @IsOptional()
  @IsString()
  observacionesConfidenciales?: string;
}

export class CrearEvaluacionPsicologicaDto extends CamposEvaluacionDto {
  @IsInt({ message: 'postulacionId es obligatorio' })
  postulacionId: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'puntajeGlobalEsre es obligatorio' })
  @Min(0)
  @Max(PUNTAJE_MAXIMO)
  puntajeGlobalEsre: number;

  @IsEnum(DictamenPsicologico, {
    message: 'dictamen debe ser APROBADO, OBSERVADO o NO_HABILITADO',
  })
  dictamen: DictamenPsicologico;

  @Transform(aListaDePoblaciones)
  @IsArray()
  @ArrayMinSize(1, { message: 'Selecciona al menos una población sugerida' })
  @ArrayUnique()
  @IsEnum(PoblacionSugerida, { each: true, message: 'Población sugerida no válida' })
  poblacionesSugeridas: PoblacionSugerida[];
}

export class ActualizarEvaluacionPsicologicaDto extends CamposEvaluacionDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'puntajeGlobalEsre debe ser numérico' })
  @Min(0)
  @Max(PUNTAJE_MAXIMO)
  puntajeGlobalEsre?: number;

  @IsOptional()
  @IsEnum(DictamenPsicologico, {
    message: 'dictamen debe ser APROBADO, OBSERVADO o NO_HABILITADO',
  })
  dictamen?: DictamenPsicologico;

  @IsOptional()
  @Transform(aListaDePoblaciones)
  @IsArray()
  @ArrayMinSize(1, { message: 'Selecciona al menos una población sugerida' })
  @ArrayUnique()
  @IsEnum(PoblacionSugerida, { each: true, message: 'Población sugerida no válida' })
  poblacionesSugeridas?: PoblacionSugerida[];
}

export class FiltroEvaluacionesDto {
  @IsOptional()
  @IsEnum(PoblacionSugerida, { message: 'Población sugerida no válida' })
  poblacion?: PoblacionSugerida;

  @IsOptional()
  @IsEnum(DictamenPsicologico, { message: 'Dictamen no válido' })
  dictamen?: DictamenPsicologico;
}
