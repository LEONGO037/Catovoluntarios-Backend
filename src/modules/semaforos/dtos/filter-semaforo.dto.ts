import { IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterSemaforoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  proyectoId?: number;

  @IsOptional()
  @IsString()
  mes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anio?: number;
}
