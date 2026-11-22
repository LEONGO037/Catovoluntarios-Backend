import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSesionInduccionDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsNotEmpty()
  fechaHora: string;

  @IsString()
  @IsOptional()
  modalidad?: string;

  @IsString()
  @IsOptional()
  lugarEnlace?: string;

  @IsString()
  @IsOptional()
  facilitador?: string;

  @IsOptional()
  proyectoId?: number;
}
