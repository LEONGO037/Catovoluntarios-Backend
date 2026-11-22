import { IsOptional, IsString } from 'class-validator';

export class FilterBaseMadreDto {
  @IsOptional()
  @IsString()
  busqueda?: string;

  @IsOptional()
  @IsString()
  nivel?: string; // 'JUNIOR' | 'PRO' | 'SUPER_PRO'

  @IsOptional()
  @IsString()
  carrera?: string;

  @IsOptional()
  @IsString()
  semestre?: string;

  @IsOptional()
  @IsString()
  estado?: string;
}
