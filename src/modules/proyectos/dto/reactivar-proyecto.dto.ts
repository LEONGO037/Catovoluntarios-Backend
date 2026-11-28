import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsNumber,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsFixedFareConstraint } from './create-proyecto-receptor.dto';

export class ReactivarProyectoDto {
  @IsOptional()
  @IsString()
  semestre?: string;

  @IsOptional()
  @IsString()
  gestion?: string;

  @IsOptional()
  @IsString()
  nombre_proyecto?: string;

  @IsOptional()
  @IsString()
  poblacion_objetivo?: string;

  @IsOptional()
  @IsString()
  actividades_semestre_actual?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Validate(IsFixedFareConstraint)
  monto_pasaje_fijo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cupo_maximo_voluntarios?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  catolider_titular_id?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  catolider_aprendiz_id?: number | null;
}
