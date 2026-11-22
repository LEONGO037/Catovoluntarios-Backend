import { IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreatePremioHistoricoDto {
  @IsInt()
  idUsuario: number;

  @IsString()
  @IsNotEmpty({ message: 'El semestre de premiación es obligatorio' })
  semestre: string;

  @IsOptional()
  @IsInt()
  proyectoId?: number;

  @IsString()
  @IsNotEmpty({ message: 'El nombre del premio o reconocimiento es obligatorio' })
  nombrePremio: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción del motivo del premio es obligatoria' })
  descripcion: string;
}
