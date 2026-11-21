import {
  IsString,
  IsEmail,
  IsDateString,
  IsNumber,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsFixedFareConstraint } from './create-proyecto-receptor.dto';

export class UpdateProyectoReceptorDto {
  @IsOptional()
  @IsString()
  nombre_proyecto?: string;

  @IsOptional()
  @IsString()
  direccion_exacta?: string;

  @IsOptional()
  @IsString()
  macrodistrito_zona?: string;

  @IsOptional()
  @IsString()
  nombre_supervisor_centro?: string;

  @IsOptional()
  @IsString()
  telefono_contacto?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsDateString()
  fecha_inicio_convenio?: string;

  @IsOptional()
  @IsDateString()
  fecha_fin_convenio?: string;

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

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
