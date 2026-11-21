import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { CondicionVoluntario } from '../entities/asignacion-ubicacion.entity';

export class FilterPostulantesAdmitidosDto {
  @IsOptional()
  @IsString()
  carrera?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  edad_min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  edad_max?: number;

  @IsOptional()
  @IsEnum(CondicionVoluntario)
  condicion?: CondicionVoluntario;

  @IsOptional()
  @IsString()
  poblacion_sugerida?: string;
}
