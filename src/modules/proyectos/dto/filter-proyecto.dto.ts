import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

export class FilterProyectoDto extends PaginationDto {
  @IsOptional()
  @IsString()
  macrodistrito_zona?: string;

  @IsOptional()
  @IsString()
  buscar?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  solo_activos?: boolean = true;
}
