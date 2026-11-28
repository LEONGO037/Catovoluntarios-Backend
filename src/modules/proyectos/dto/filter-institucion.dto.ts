import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

export class FilterInstitucionDto extends PaginationDto {
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
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  solo_activas?: boolean;
}
