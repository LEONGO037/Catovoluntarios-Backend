import { IsOptional, IsString } from 'class-validator';

export class FilterGestionDto {
  @IsOptional()
  @IsString()
  semestre?: string;

  @IsOptional()
  @IsString()
  gestion?: string;
}
