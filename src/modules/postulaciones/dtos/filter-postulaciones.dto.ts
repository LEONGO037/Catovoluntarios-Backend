import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoPostulacion } from '../entities/postulacion.entity';

export class FilterPostulacionesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  carrera?: string;

  @IsOptional()
  @IsString()
  zonaResidencia?: string;

  @IsOptional()
  @IsEnum(EstadoPostulacion)
  estado?: EstadoPostulacion;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
