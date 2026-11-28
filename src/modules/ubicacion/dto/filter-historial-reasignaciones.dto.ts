import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterHistorialReasignacionesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_proyecto?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_usuario?: number;

  @IsOptional()
  @IsString()
  semestre?: string;

  @IsOptional()
  @IsString()
  gestion?: string;
}
