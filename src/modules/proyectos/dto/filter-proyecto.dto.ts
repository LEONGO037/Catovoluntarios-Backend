import { IsOptional, IsString, IsBoolean, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }
  return value as boolean;
}

export class FilterProyectoDto extends PaginationDto {
  @IsOptional()
  @IsString()
  macrodistrito_zona?: string;

  @IsOptional()
  @IsString()
  buscar?: string;

  @IsOptional()
  @IsString()
  semestre?: string;

  @IsOptional()
  @IsString()
  gestion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id_institucion?: number;

  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  solo_activos?: boolean = true;

  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  incluirInactivos?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  incluir_inactivos?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  todos_semestres?: boolean = false;
}
