import { IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSesionInduccionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titulo: string;

  @IsDateString({ strict: true })
  fechaHora: string;

  @IsIn(['PRESENCIAL', 'VIRTUAL'])
  @IsOptional()
  modalidad?: string;

  @IsString()
  @IsOptional()
  lugarEnlace?: string;

  @IsString()
  @IsOptional()
  @MaxLength(150)
  facilitador?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  proyectoId?: number;
}
