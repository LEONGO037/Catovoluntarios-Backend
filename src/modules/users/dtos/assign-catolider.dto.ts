import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignCatoliderDto {
  @IsInt({ message: 'El ID del voluntario debe ser un entero' })
  voluntarioId: number;

  @IsString()
  @IsNotEmpty({ message: 'La modalidad de liderazgo es obligatoria' })
  modalidadLiderazgo: string;

  @IsString()
  @IsNotEmpty({ message: 'El semestre de gestión es obligatorio' })
  semestre: string;

  @IsOptional()
  @IsInt()
  proyectoReceptorAsignadoId?: number;

  @IsOptional()
  @IsString()
  catoliderTipo?: string;
}

export class ResetCatolideresDto {
  @IsOptional()
  @IsString()
  semestreAnterior?: string;
}
